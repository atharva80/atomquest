import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { sendEscalationAlertEmail } from '@/emails/send';

const MAX_ESCALATION_LEVEL = 3;

interface EscalationTarget {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  manager_id: string | null;
}

async function getEscalationTarget(supabase: any, profileId: string, level: number): Promise<{ target: EscalationTarget; recipientName: string; actionLink: string } | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, manager_id')
    .eq('id', profileId)
    .single();

  if (!profile) return null;

  if (level === 1) {
    return {
      target: profile,
      recipientName: `${profile.first_name} ${profile.last_name}`,
      actionLink: '/employee/goals'
    };
  } else if (level === 2) {
    if (!profile.manager_id) return null;
    const { data: manager } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, manager_id')
      .eq('id', profile.manager_id)
      .single();
    if (!manager) return null;
    return {
      target: manager,
      recipientName: `${manager.first_name} ${manager.last_name}`,
      actionLink: '/manager/approvals'
    };
  } else {
    const { data: admins } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .eq('role', 'admin')
      .limit(1);
    if (!admins || admins.length === 0) return null;
    const admin = admins[0];
    return {
      target: admin,
      recipientName: `${admin.first_name} ${admin.last_name}`,
      actionLink: '/admin/escalations'
    };
  }
}

async function checkAndCreateEscalation(
  supabase: any,
  type: string,
  profileId: string,
  cycleId: string,
  daysThreshold: number
): Promise<{ created: boolean; reason?: string }> {
  const now = new Date();

  const { data: existingEscalations } = await supabase
    .from('escalations')
    .select('id, created_at, escalated_to_id')
    .eq('target_user_id', profileId)
    .eq('cycle_id', cycleId)
    .eq('type', type)
    .is('resolved_at', null)
    .order('created_at', { ascending: false })
    .limit(1);

  let escalationLevel = 1;
  if (existingEscalations && existingEscalations.length > 0) {
    const lastEscalation = existingEscalations[0];
    const daysSinceEscalation = (now.getTime() - new Date(lastEscalation.created_at).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceEscalation < daysThreshold) {
      return { created: false, reason: 'recently_escalated' };
    }

    const { data: allEscalations } = await supabase
      .from('escalations')
      .select('id')
      .eq('target_user_id', profileId)
      .eq('cycle_id', cycleId)
      .eq('type', type);

    escalationLevel = Math.min((allEscalations?.length || 0) + 1, MAX_ESCALATION_LEVEL);
    
    if (escalationLevel > MAX_ESCALATION_LEVEL) {
      return { created: false, reason: 'max_level_reached' };
    }
  }

  const escalationTarget = await getEscalationTarget(supabase, profileId, escalationLevel);
  if (!escalationTarget) return { created: false, reason: 'no_target' };

  const { error: insertError } = await supabase
    .from('escalations')
    .insert({
      target_user_id: profileId,
      escalated_to_id: escalationTarget.target.id,
      cycle_id: cycleId,
      type: type,
    });

  if (insertError) {
    console.error('[Escalation] Insert error:', insertError);
    return { created: false, reason: 'insert_failed' };
  }

  const { data: cycle } = await supabase
    .from('cycles')
    .select('name')
    .eq('id', cycleId)
    .single();

  await sendEscalationAlertEmail({
    to: escalationTarget.target.email,
    recipientName: escalationTarget.recipientName,
    escalationType: type,
    targetEmployee: `${escalationTarget.target.first_name} ${escalationTarget.target.last_name}`,
    daysPending: daysThreshold,
    cycleName: cycle?.name,
    escalationLevel: escalationLevel,
    actionLink: escalationTarget.actionLink,
  });

  return { created: true };
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = createAdminClient();
  let totalCreated = 0;

  try {
    const { data: rules } = await supabase
      .from('escalation_rules')
      .select('*')
      .eq('is_active', true);

    if (!rules || rules.length === 0) {
      return NextResponse.json({ success: true, message: 'No active escalation rules', created: 0 });
    }

    const { data: activeCycles } = await supabase
      .from('cycles')
      .select('id, name, start_date')
      .eq('is_active', true);

    for (const rule of rules) {
      const daysThreshold = rule.days_threshold;
      const now = new Date();
      const thresholdDate = new Date(now.getTime() - daysThreshold * 24 * 60 * 60 * 1000);

      if (rule.type === 'goal_not_submitted' && activeCycles) {
        for (const cycle of activeCycles) {
          if (new Date(cycle.start_date) > thresholdDate) continue;

          const { data: profiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'employee');

          if (!profiles) continue;

          for (const profile of profiles) {
            // Get all goals for this employee in this cycle
            const { data: allGoals } = await supabase
              .from('goals')
              .select('id')
              .eq('profile_id', profile.id)
              .eq('cycle_id', cycle.id)
              .in('status', ['draft', 'submitted', 'approved', 'returned']);

            if (!allGoals || allGoals.length === 0) {
              // Check if they have shared goals - if so, they have goals to work on
              const { data: sharedGoalsForEmployee } = await supabase
                .from('shared_goals')
                .select('id')
                .eq('recipient_profile_id', profile.id);

              // Only escalate if they have NO goals at all (not even shared)
              if (!sharedGoalsForEmployee || sharedGoalsForEmployee.length === 0) {
                const result = await checkAndCreateEscalation(
                  supabase,
                  rule.type,
                  profile.id,
                  cycle.id,
                  daysThreshold
                );
                if (result.created) totalCreated++;
              }
            }
          }
        }
      }

      if (rule.type === 'goal_not_approved' && activeCycles) {
        for (const cycle of activeCycles) {
          const { data: submittedGoals } = await supabase
            .from('goals')
            .select('profile_id, created_at, id')
            .eq('cycle_id', cycle.id)
            .eq('status', 'submitted')
            .lt('created_at', thresholdDate.toISOString());

          if (!submittedGoals) continue;

          const processedProfiles = new Set<string>();
          for (const goal of submittedGoals) {
            if (processedProfiles.has(goal.profile_id)) continue;
            
            // Skip if this is a shared goal (recipient's copy)
            const { data: isSharedGoal } = await supabase
              .from('shared_goals')
              .select('id')
              .eq('primary_goal_id', goal.id)
              .single();
            
            if (isSharedGoal) continue;
            
            processedProfiles.add(goal.profile_id);

            const result = await checkAndCreateEscalation(
              supabase,
              rule.type,
              goal.profile_id,
              cycle.id,
              daysThreshold
            );
            if (result.created) totalCreated++;
          }
        }
      }

      if (rule.type === 'checkin_not_completed' && activeCycles) {
        for (const cycle of activeCycles) {
          const { data: profilesWithCheckins } = await supabase
            .from('quarterly_checkins')
            .select('goals(profile_id)')
            .eq('status', 'completed');

          const checkedInProfileIds = new Set(
            profilesWithCheckins?.map(c => c.goals?.profile_id).filter(Boolean) || []
          );

          const { data: employeeProfiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'employee');

          if (!employeeProfiles) continue;

          for (const profile of employeeProfiles) {
            if (checkedInProfileIds.has(profile.id)) continue;

            const { data: userGoals } = await supabase
              .from('goals')
              .select('created_at')
              .eq('profile_id', profile.id)
              .eq('cycle_id', cycle.id)
              .limit(1);

            if (userGoals && userGoals.length > 0) {
              const result = await checkAndCreateEscalation(
                supabase,
                rule.type,
                profile.id,
                cycle.id,
                daysThreshold
              );
              if (result.created) totalCreated++;
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: `Created ${totalCreated} escalations`, created: totalCreated });
  } catch (error) {
    console.error('[Escalation Cron] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process escalations' }, { status: 500 });
  }
}