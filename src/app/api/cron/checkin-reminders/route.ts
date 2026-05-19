/**
 * Cron Job — Check-in Reminders
 * 
 * Sends email reminders to employees at the start of each quarter.
 * Run schedule: Daily (will check if today is the start of a quarter)
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { sendCheckinReminderEmail } from '@/emails/send';
import { NextResponse } from 'next/server';

const QUARTER_START_MONTHS: Record<string, string> = {
  '01': 'Q4',  // January -> Q4 (of previous year, but cycle typically starts in Q4 for next year)
  '04': 'Q1',  // April -> Q1
  '07': 'Q2',  // July -> Q2
  '10': 'Q3',  // October -> Q3
};

function getCurrentQuarterFromDate(): string | null {
  const month = new Date().toISOString().slice(5, 7);
  return QUARTER_START_MONTHS[month] || null;
}

function getQuarterDeadline(quarter: string): string {
  const deadlines: Record<string, string> = {
    'Q1': 'April 15',
    'Q2': 'July 15', 
    'Q3': 'October 15',
    'Q4': 'January 15',
  };
  return deadlines[quarter] || 'End of quarter';
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = createAdminClient();
  const currentQuarter = getCurrentQuarterFromDate();

  if (!currentQuarter) {
    return NextResponse.json({ 
      success: true, 
      message: `Not a quarter start month, skipping reminder`,
      sent: 0 
    });
  }

  try {
    // Get active cycles
    const { data: activeCycles } = await supabase
      .from('cycles')
      .select('id, name')
      .eq('is_active', true);

    if (!activeCycles || activeCycles.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No active cycles', 
        sent: 0 
      });
    }

    const cycleId = activeCycles[0].id;
    const cycleName = activeCycles[0].name;

    // Get employees who haven't submitted check-in for this quarter
    const { data: pendingCheckins } = await supabase
      .from('goals')
      .select(`
        profile_id,
        profiles!inner(first_name, last_name, email)
      `)
      .eq('cycle_id', cycleId)
      .neq('status', 'draft');

    if (!pendingCheckins || pendingCheckins.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No employees with pending check-ins', 
        sent: 0 
      });
    }

    // Get employees who already submitted for this quarter
    const pendingProfileIds = pendingCheckins.map(g => g.profile_id);
    const { data: submittedCheckins } = await supabase
      .from('quarterly_checkins')
      .select('goal_id')
      .eq('quarter', currentQuarter as 'Q1' | 'Q2' | 'Q3' | 'Q4');

    // Get profile_ids that already submitted by cross-referencing with goals
    const submittedGoalIds = new Set(submittedCheckins?.map(c => c.goal_id) || []);
    const { data: submittedGoals } = await supabase
      .from('goals')
      .select('profile_id')
      .in('id', Array.from(submittedGoalIds));

    const submittedProfileIds = new Set(
      submittedGoals?.map(g => g.profile_id).filter(Boolean) || []
    );

    // Filter employees who haven't submitted yet
    const employeesToRemind = pendingCheckins.filter(
      g => !submittedProfileIds.has(g.profile_id)
    );

    // Deduplicate by profile
    const uniqueEmployees = Array.from(
      new Map(employeesToRemind.map(e => [e.profile_id, e])).values()
    );

    const deadline = getQuarterDeadline(currentQuarter);
    let sentCount = 0;

    for (const emp of uniqueEmployees) {
      const profile = emp.profiles;
      if (profile?.email) {
        const fullName = `${profile.first_name} ${profile.last_name}`;
        
        await sendCheckinReminderEmail({
          to: profile.email,
          employeeName: fullName,
          quarter: currentQuarter,
          deadline
        });
        
        sentCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sentCount} check-in reminders for ${currentQuarter}`,
      sent: sentCount,
      quarter: currentQuarter,
      cycleName
    });

  } catch (error) {
    console.error('[CheckinReminder] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send reminders' 
    }, { status: 500 });
  }
}

export async function GET() {
  return POST(new Request('http://localhost', { method: 'POST' }));
}