/**
 * DEV-ONLY: Test email blast
 * GET /api/dev/test-emails
 * Sends one of every email type to EMAIL_DEV_OVERRIDE.
 * Remove or restrict this route before any public production launch.
 */

import { NextResponse } from 'next/server';
import {
  sendGoalSubmittedEmail,
  sendGoalApprovedEmail,
  sendGoalReturnedEmail,
  sendCheckinReminderEmail,
  sendCheckinSubmittedEmail,
  sendEscalationAlertEmail,
  sendEscalationResolvedEmail,
} from '@/emails/send';

export async function GET() {
  const override = process.env.EMAIL_DEV_OVERRIDE;
  if (!override) {
    return NextResponse.json(
      { error: 'EMAIL_DEV_OVERRIDE is not set in .env.local' },
      { status: 400 }
    );
  }

  const results: Record<string, string> = {};

  const run = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      results[name] = '✅ sent';
    } catch (e: any) {
      results[name] = `❌ ${e?.message ?? 'unknown error'}`;
    }
  };

  await run('goal_submitted', () =>
    sendGoalSubmittedEmail({
      to: override,
      managerName: 'Ravi Kumar',
      employeeName: 'Priya Sharma',
      employeeId: 'test-employee-id-123',
      goalCount: 6,
      cycleName: 'FY 2024–25',
    })
  );

  await run('goal_approved', () =>
    sendGoalApprovedEmail({
      to: override,
      employeeName: 'Priya Sharma',
      cycleName: 'FY 2024–25',
    })
  );

  await run('goal_returned', () =>
    sendGoalReturnedEmail({
      to: override,
      employeeName: 'Priya Sharma',
      cycleName: 'FY 2024–25',
      managerComment:
        'Please revisit the weightage distribution — total must equal 100%. Also clarify the target metric for Goal 3.',
    })
  );

  await run('checkin_reminder', () =>
    sendCheckinReminderEmail({
      to: override,
      employeeName: 'Priya Sharma',
      quarter: 'Q2',
      deadline: 'October 31, 2024',
    })
  );

  await run('checkin_submitted', () =>
    sendCheckinSubmittedEmail({
      to: override,
      managerName: 'Ravi Kumar',
      employeeName: 'Priya Sharma',
      employeeId: 'test-employee-id-123',
      quarter: 'Q2',
      goalsReviewed: 6,
    })
  );

  await run('escalation_alert', () =>
    sendEscalationAlertEmail({
      to: override,
      recipientName: 'Admin',
      escalationType: 'goal_sheet_not_submitted',
      targetEmployee: 'Priya Sharma',
      daysPending: 12,
      cycleName: 'FY 2024–25',
      escalationLevel: 1,
      actionLink: `${process.env.NEXT_PUBLIC_APP_URL}/admin/escalations`,
    })
  );

  await run('escalation_resolved', () =>
    sendEscalationResolvedEmail({
      to: override,
      recipientName: 'Admin',
      escalationType: 'goal_sheet_not_submitted',
      targetEmployee: 'Priya Sharma',
      resolvedBy: 'Ravi Kumar',
    })
  );

  return NextResponse.json({
    sent_to: override,
    results,
  });
}
