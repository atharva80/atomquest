/**
 * Email — Send Utility
 *
 * Centralized email sending via Resend.
 * Currently stubs actual sending if API key is not present.
 */

// import { Resend } from 'resend';
// const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || 'AtomQuest <notifications@atomquest.demo>';

export async function sendGoalSubmittedEmail(to: string, employeeName: string, goalCount: number): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Stub] -> ${to}: ${employeeName} submitted ${goalCount} goals.`);
    return;
  }
  // resend.emails.send({...})
}

export async function sendGoalApprovedEmail(to: string, employeeName: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Stub] -> ${to}: ${employeeName}'s goals were approved.`);
    return;
  }
}

export async function sendGoalRejectedEmail(to: string, employeeName: string, comment: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Stub] -> ${to}: ${employeeName}'s goals were returned. Comment: ${comment}`);
    return;
  }
}

export async function sendCheckinReminderEmail(to: string, employeeName: string, quarter: string, deadline: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Stub] -> ${to}: Reminder for ${employeeName} to submit ${quarter} checkin before ${deadline}.`);
    return;
  }
}

export async function sendEscalationAlertEmail(to: string, escalationType: string, targetEmployee: string, daysPending: number): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Stub] -> ${to}: Escalation (${escalationType}) for ${targetEmployee} - pending for ${daysPending} days.`);
    return;
  }
}
