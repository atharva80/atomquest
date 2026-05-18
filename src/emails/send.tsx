import { Resend } from 'resend';
import { render } from '@react-email/render';
import { GoalSubmittedEmail } from './templates/goal-submitted';
import { GoalApprovedEmail } from './templates/goal-approved';
import { GoalReturnedEmail } from './templates/goal-returned';
import { CheckinReminderEmail } from './templates/checkin-reminder';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || 'AtomQuest <notifications@atomquest.demo>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function send(to: string, subject: string, html: string) {
  // DEV OVERRIDE: Force all emails to the verified Resend testing address
  to = 'scrollwithme80@gmail.com';

  if (!resend) {
    console.log(`[Email Stub] TO: ${to} | SUBJECT: ${subject}`);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
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

export async function sendEscalationAlertEmail(params: {
  to: string;
  escalationType: string;
  targetEmployee: string;
  daysPending: number;
}) {
  const subject = `Escalation: ${params.escalationType.replace(/_/g, ' ')} for ${params.targetEmployee}`;
  const message = `[Email Stub] TO: ${params.to} | SUBJECT: ${subject} — ${params.targetEmployee} has ${params.daysPending} days pending`;
  console.log(message);
}