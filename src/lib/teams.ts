const TEAMS_WEBHOOK = process.env.TEAMS_WEBHOOK_URL;

interface TeamsCardParams {
  title: string;
  summary: string;
  facts: Array<{ name: string; value: string }>;
  actionUrl?: string;
  actionLabel?: string;
}

export async function sendTeamsCard(params: TeamsCardParams): Promise<void> {
  if (!TEAMS_WEBHOOK) {
    console.log('[Teams Stub] Card not sent — no webhook configured:', params.title);
    return;
  }

  const card = {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    themeColor: '09090b',
    summary: params.summary,
    sections: [{
      activityTitle: `**${params.title}**`,
      activitySubtitle: params.summary,
      facts: params.facts,
    }],
    ...(params.actionUrl ? {
      potentialAction: [{
        '@type': 'OpenUri',
        name: params.actionLabel || 'View in Orbit',
        targets: [{ os: 'default', uri: params.actionUrl }]
      }]
    } : {})
  };

  try {
    const res = await fetch(TEAMS_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card),
    });

    if (!res.ok) {
      console.error('[Teams] Webhook failed:', res.status, await res.text());
    }
  } catch (err) {
    console.error('[Teams] Send error:', err);
  }
}

export async function notifyManagerGoalSubmitted(managerName: string, employeeName: string, goalCount: number, appUrl: string) {
  await sendTeamsCard({
    title: 'Goal Sheet Submitted for Approval',
    summary: `${employeeName} submitted ${goalCount} goals pending your review`,
    facts: [
      { name: 'Employee', value: employeeName },
      { name: 'Goals', value: String(goalCount) },
      { name: 'Status', value: 'Pending Approval' },
    ],
    actionUrl: `${appUrl}/manager/approvals`,
    actionLabel: 'Review in Orbit',
  });
}

export async function notifyEmployeeGoalApproved(employeeName: string, cycleName: string, appUrl: string) {
  await sendTeamsCard({
    title: 'Goal Sheet Approved',
    summary: `Your goals for ${cycleName} have been approved`,
    facts: [
      { name: 'Employee', value: employeeName },
      { name: 'Cycle', value: cycleName },
      { name: 'Status', value: 'Approved' },
    ],
    actionUrl: `${appUrl}/employee/goals`,
    actionLabel: 'View Goals',
  });
}

export async function notifyEmployeeGoalReturned(employeeName: string, cycleName: string, appUrl: string) {
  await sendTeamsCard({
    title: 'Goal Sheet Returned for Revision',
    summary: `Your goals for ${cycleName} need revisions`,
    facts: [
      { name: 'Employee', value: employeeName },
      { name: 'Cycle', value: cycleName },
      { name: 'Status', value: 'Returned' },
    ],
    actionUrl: `${appUrl}/employee/goals`,
    actionLabel: 'Revise Goals',
  });
}