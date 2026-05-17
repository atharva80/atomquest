import { createClient } from '@/lib/supabase/server';
import { QuarterType, GoalStatus } from '@/types';

export async function getManagerStats(managerId: string, cycleId: string, currentQuarter: QuarterType | null) {
  const supabase = await createClient();

  // 1. Get team member IDs
  const { data: teamProfiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('manager_id', managerId);

  const teamIds = teamProfiles?.map(p => p.id) || [];

  if (teamIds.length === 0) {
    return {
      pendingApprovalsCount: 0,
      pendingReviewsCount: 0,
      statusCounts: {
        draft: 0,
        submitted: 0,
        approved: 0,
        locked: 0
      }
    };
  }

  // 2. Count pending approvals (employees with submitted goals)
  const { data: submittedGoals } = await supabase
    .from('goals')
    .select('profile_id')
    .eq('cycle_id', cycleId)
    .eq('status', 'submitted')
    .in('profile_id', teamIds);

  const pendingApprovalsCount = new Set(submittedGoals?.map(g => g.profile_id)).size;

  // 3. Count check-ins to review
  let pendingReviewsCount = 0;
  if (currentQuarter) {
    // Get check-ins for the team in the current quarter
    const { data: teamCheckins } = await supabase
      .from('quarterly_checkins')
      .select('goal_id, goals!inner(profile_id)')
      .eq('quarter', currentQuarter)
      .eq('goals.cycle_id', cycleId)
      .in('goals.profile_id', teamIds);

    // Get manager comments already provided
    const { data: managerComments } = await supabase
      .from('manager_comments')
      .select('profile_id')
      .eq('cycle_id', cycleId)
      .eq('manager_id', managerId)
      .eq('quarter', currentQuarter);

    const commentedProfiles = new Set(managerComments?.map(c => c.profile_id));
    const pendingReviewProfiles = new Set(
      teamCheckins
        ?.filter(tc => !commentedProfiles.has((tc.goals as any).profile_id))
        .map(tc => (tc.goals as any).profile_id)
    );
    
    pendingReviewsCount = pendingReviewProfiles.size;
  }

  // 4. Status distribution for chart
  const { data: allTeamGoals } = await supabase
    .from('goals')
    .select('profile_id, status')
    .eq('cycle_id', cycleId)
    .in('profile_id', teamIds);

  const statusCounts = {
    draft: 0,
    submitted: 0,
    approved: 0,
    locked: 0
  };

  const employeeGoals = new Map();
  teamIds.forEach(id => employeeGoals.set(id, []));
  allTeamGoals?.forEach(goal => employeeGoals.get(goal.profile_id).push(goal.status));

  employeeGoals.forEach((statuses) => {
    if (statuses.length === 0 || statuses.every((s: string) => s === 'draft')) {
      statusCounts.draft++;
    } else if (statuses.some((s: string) => s === 'returned')) {
      statusCounts.draft++;
    } else if (statuses.every((s: string) => s === 'locked')) {
      statusCounts.locked++;
    } else if (statuses.every((s: string) => s === 'approved')) {
      statusCounts.approved++;
    } else if (statuses.some((s: string) => s === 'submitted')) {
      statusCounts.submitted++;
    } else {
      statusCounts.draft++;
    }
  });

  return {
    pendingApprovalsCount,
    pendingReviewsCount,
    statusCounts
  };
}
