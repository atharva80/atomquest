import { Resend } from 'resend';
import { render } from '@react-email/render';
import { GoalSubmittedEmail } from './templates/goal-submitted';
import { GoalApprovedEmail } from './templates/goal-approved';
import { GoalReturnedEmail } from './templates/goal-returned';
import { CheckinReminderEmail } from './templates/checkin-reminder';
import { CheckinSubmittedEmail } from './templates/checkin-submitted';
import { EscalationAlertEmail } from './templates/escalation-alert';
import { EscalationResolvedEmail } from './templates/escalation-resolved';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || 'AtomQuest <notifications@atomquest.demo>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function send(to: string | string[], subject: string, html: string) {
  // DEV OVERRIDE: Force all emails to the verified Resend testing address
  const target = 'scrollwithme80@gmail.com';

  if (!resend) {
    console.log(`[Email Stub] TO: ${target} | SUBJECT: ${subject}`);
    return;
  }
  const recipients = Array.isArray(to) ? to : [to];
  try {
    await resend.emails.send({ from: FROM, to: target, subject, html });
  } catch (err) {
    console.error('[Email] Send failed:', err);
  }
}

export async function sendGoalSubmittedEmail(params: {
  to: string;
  managerName: string;
  employeeName: string;
  goalCount: number;
  cycleName: string;
}) {
  const html = await render(
    <GoalSubmittedEmail
      {...params}
      appUrl={APP_URL}
      approvalLink={`${APP_URL}/manager/approvals`}
    />
  );
  await send(params.to, `${params.employeeName} submitted their goal sheet`, html);
}

export async function sendGoalApprovedEmail(params: {
  to: string;
  employeeName: string;
  cycleName: string;
}) {
  const html = await render(
    <GoalApprovedEmail
      {...params}
      appUrl={APP_URL}
      goalsLink={`${APP_URL}/employee/goals`}
    />
  );
  await send(params.to, 'Your goal sheet has been approved', html);
}

export async function sendGoalReturnedEmail(params: {
  to: string;
  employeeName: string;
  cycleName: string;
  managerComment: string;
}) {
  const html = await render(
    <GoalReturnedEmail
      {...params}
      appUrl={APP_URL}
      goalsLink={`${APP_URL}/employee/goals`}
    />
  );
  await send(params.to, 'Your goal sheet requires revision', html);
}

export async function sendCheckinReminderEmail(params: {
  to: string;
  employeeName: string;
  quarter: string;
  deadline: string;
}) {
  const html = await render(
    <CheckinReminderEmail
      {...params}
      appUrl={APP_URL}
      checkinsLink={`${APP_URL}/employee/check-ins`}
    />
  );
  await send(params.to, `Action required: ${params.quarter} check-in due ${params.deadline}`, html);
}

export async function sendCheckinSubmittedEmail(params: {
  to: string;
  managerName: string;
  employeeName: string;
  quarter: string;
  goalsReviewed: number;
}) {
  const html = await render(
    <CheckinSubmittedEmail
      {...params}
      appUrl={APP_URL}
      reviewLink={`${APP_URL}/manager/check-ins`}
    />
  );
  await send(params.to, `${params.employeeName} submitted their ${params.quarter} check-in`, html);
}

export async function sendEscalationAlertEmail(params: {
  to: string;
  recipientName: string;
  escalationType: string;
  targetEmployee: string;
  daysPending: number;
  cycleName?: string;
  escalationLevel: number;
  actionLink: string;
}) {
  const subject = `⚠️ Escalation Alert: ${params.escalationType.replace(/_/g, ' ')} - ${params.targetEmployee}`;
  const html = await render(
    <EscalationAlertEmail
      {...params}
      appUrl={APP_URL}
    />
  );
  await send(params.to, subject, html);
}

export async function sendEscalationResolvedEmail(params: {
  to: string;
  recipientName: string;
  escalationType: string;
  targetEmployee: string;
  resolvedBy: string;
}) {
  const subject = `✅ Escalation Resolved: ${params.escalationType.replace(/_/g, ' ')}`;
  const html = await render(
    <EscalationResolvedEmail
      {...params}
      appUrl={APP_URL}
    />
  );
  await send(params.to, subject, html);
}

export async function sendGoalDeletedNotification(params: {
  to: string[];
  employeeName: string;
  goalTitle: string;
  cycleId: string;
}) {
  const subject = `⚠️ Goal Deleted by ${params.employeeName}`;
  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #18181b; font-size: 20px; margin-bottom: 16px;">Goal Deleted</h2>
      <p style="color: #3f3f46; font-size: 14px; line-height: 20px;">
        <strong>${params.employeeName}</strong> has deleted their goal:
      </p>
      <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="color: #18181b; font-size: 16px; font-weight: 600; margin: 0;">${params.goalTitle}</p>
      </div>
      <p style="color: #71717a; font-size: 12px;">
        This goal was in draft status and has been removed from their goal sheet.
      </p>
      <a href="${APP_URL}/admin" style="display: inline-block; margin-top: 16px; color: #18181b; font-size: 14px;">
        View Admin Dashboard →
      </a>
    </div>
  `;
  await send(params.to, subject, html);
}