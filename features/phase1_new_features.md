# AtomQuest — Advanced Features Implementation Plan
## Phase 1: SSO + Email & Teams Integration (5.1 + 5.2)

> **FOR THE IMPLEMENTING MODEL**: Read every section before writing a single line of code. Follow the order exactly. Run `npx tsc --noEmit` after each major step to catch type errors early. Never use `any` types unless explicitly stated. Always run `npm run build` at the very end to confirm zero errors.

---

## Project Context

**Stack**: Next.js 14 App Router, Supabase (Postgres + Auth), TypeScript, Tailwind CSS, Tremor, Radix UI, Resend (email), Sonner (toasts), Zod (validation).

**Key Files Already Existing**:
- `src/middleware.ts` — Auth middleware with role-based routing
- `src/lib/supabase/client.ts` — Browser Supabase client
- `src/lib/supabase/server.ts` — Server Supabase client
- `src/emails/send.ts` — Email stub utilities (Resend stubs only, NOT implemented)
- `src/app/api/cron/escalation/route.ts` — Escalation cron (stub only)
- `src/types/supabase.ts` — Full Supabase type definitions

**Database Enums** (DO NOT change these):
- `user_role`: `employee | manager | admin`
- `goal_status`: `draft | submitted | approved | returned | locked`
- `escalation_type`: `goal_not_submitted | goal_not_approved | checkin_not_completed`
- `progress_status`: `not_started | on_track | completed`
- `quarter_type`: `Q1 | Q2 | Q3 | Q4`

**Profiles table columns**: `id, email, first_name, last_name, full_name, role, department_id, manager_id, employee_code, created_at, updated_at`. Note: **NO `avatar_url` column exists.**

---

## FEATURE 5.1 — Microsoft Entra ID (Azure AD) SSO

### Overview
We implement Azure AD OAuth using **NextAuth.js v5 (Auth.js)** with Supabase as the user store. When a user logs in via Azure AD, we upsert their profile in Supabase and sync their manager relationship from the Azure AD `manager` attribute.

> **IMPORTANT DECISION**: Do NOT replace Supabase Auth entirely. Use **NextAuth alongside Supabase**. NextAuth handles the Azure OAuth dance; on successful login, we create/update the Supabase user record using the Admin client and issue a Supabase session cookie for the rest of the app.

### Step 1 — Install Dependencies

```bash
npm install next-auth@beta @auth/core
```

No other packages are needed. Do NOT install `@azure/identity` or `msal-*` packages.

### Step 2 — Environment Variables

Add to `.env.local`. These MUST exist or the build will fail:

```env
# Azure AD SSO
AZURE_AD_CLIENT_ID=<from Azure App Registration>
AZURE_AD_CLIENT_SECRET=<from Azure App Registration>
AZURE_AD_TENANT_ID=<your tenant id>
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# Supabase Admin (already exists but confirm)
SUPABASE_SERVICE_ROLE_KEY=<already in .env.local>
```

### Step 3 — Create Auth.js Configuration

**File**: `src/lib/auth.ts` [NEW]

```typescript
import NextAuth from 'next-auth';
import AzureAD from 'next-auth/providers/azure-ad';
import { createAdminClient } from '@/lib/supabase/admin';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    AzureAD({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      // Request additional claims for org hierarchy sync
      authorization: {
        params: {
          scope: 'openid profile email User.Read'
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== 'azure-ad') return true;
      
      const supabase = createAdminClient();
      
      // Determine role from Azure AD group membership
      // Groups must be configured in Azure App Registration to return in token claims
      // Default to 'employee' if no group match
      const groups: string[] = (profile as any)?.groups || [];
      let role: 'employee' | 'manager' | 'admin' = 'employee';
      
      const ADMIN_GROUP_ID = process.env.AZURE_ADMIN_GROUP_ID;
      const MANAGER_GROUP_ID = process.env.AZURE_MANAGER_GROUP_ID;
      
      if (ADMIN_GROUP_ID && groups.includes(ADMIN_GROUP_ID)) role = 'admin';
      else if (MANAGER_GROUP_ID && groups.includes(MANAGER_GROUP_ID)) role = 'manager';
      
      // Upsert profile in Supabase
      const nameParts = (user.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const { error } = await supabase.from('profiles').upsert({
        id: user.id!, // NextAuth uses Azure OID as user.id
        email: user.email!,
        first_name: firstName,
        last_name: lastName,
        full_name: user.name || '',
        role,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      
      if (error) {
        console.error('[SSO] Profile upsert failed:', error);
        return false;
      }
      
      return true;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  }
});
```

> **GOTCHA**: Azure AD returns `oid` (Object ID) as the user identifier, not email. NextAuth maps this to `account.providerAccountId`. Make sure `user.id` is set to `oid` in the provider config or extract it from `profile.oid`.

### Step 4 — Create NextAuth API Route

**File**: `src/app/api/auth/[...nextauth]/route.ts` [NEW]

```typescript
import { handlers } from '@/lib/auth';
export const { GET, POST } = handlers;
```

> **IMPORTANT**: The existing `src/app/api/auth/signout/route.ts` handles Supabase sign-out. Leave it untouched. NextAuth has its own `/api/auth/signout` endpoint that operates independently.

### Step 5 — Add SSO Button to Login Page

**File**: `src/app/(auth)/login/page.tsx` [MODIFY]

Add the following import at the top of the file:
```typescript
import { signIn } from '@/lib/auth';
```

Add this button ABOVE the existing "Quick Demo Login" divider section:

```tsx
{/* Microsoft SSO Section */}
<div className="mb-6">
  <form action={async () => {
    'use server';
    await signIn('azure-ad', { redirectTo: '/' });
  }}>
    <button
      type="submit"
      className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-zinc-200 rounded bg-white hover:bg-zinc-50 transition-colors font-table-cell-primary text-table-cell-primary text-zinc-700"
    >
      {/* Microsoft Logo SVG */}
      <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
        <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
        <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
        <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
        <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
      </svg>
      Sign in with Microsoft
    </button>
  </form>
</div>
```

> **GOTCHA**: The `signIn` server action only works in Server Components or Server Actions. Since `login/page.tsx` is a Client Component (`'use client'`), you MUST extract the form into a separate Server Component file (e.g., `src/components/auth/microsoft-sso-button.tsx`) and import it.

**File**: `src/components/auth/microsoft-sso-button.tsx` [NEW]

```tsx
import { signIn } from '@/lib/auth';

export function MicrosoftSSOButton() {
  return (
    <form action={async () => {
      'use server';
      await signIn('azure-ad', { redirectTo: '/' });
    }}>
      <button type="submit" className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-zinc-200 rounded bg-white hover:bg-zinc-50 transition-colors font-table-cell-primary text-table-cell-primary text-zinc-700">
        <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
          <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
          <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
          <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
          <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
        </svg>
        Sign in with Microsoft
      </button>
    </form>
  );
}
```

Then in `login/page.tsx`, just add `<MicrosoftSSOButton />` right above the demo login divider.

### Step 6 — Add Manager Sync Endpoint (Org Hierarchy)

After a user logs in via Azure, we need to fetch their manager from Microsoft Graph API and update `manager_id` in Supabase.

**File**: `src/app/api/auth/sync-manager/route.ts` [NEW]

```typescript
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  const { userId, accessToken } = await req.json();
  
  if (!userId || !accessToken) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  try {
    // Fetch manager from Microsoft Graph
    const graphRes = await fetch('https://graph.microsoft.com/v1.0/me/manager', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!graphRes.ok) {
      // User has no manager (top of hierarchy) - this is fine
      return NextResponse.json({ synced: false, reason: 'no_manager' });
    }

    const managerData = await graphRes.json();
    const managerEmail: string = managerData.mail || managerData.userPrincipalName;

    const supabase = createAdminClient();

    // Find the manager's profile in Supabase by email
    const { data: managerProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', managerEmail)
      .single();

    if (managerProfile) {
      await supabase
        .from('profiles')
        .update({ manager_id: managerProfile.id })
        .eq('id', userId);
    }

    return NextResponse.json({ synced: true });
  } catch (err) {
    console.error('[Manager Sync] Error:', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
```

Call this endpoint from the NextAuth `signIn` callback after the profile upsert, passing the `accessToken` from the `account` object.

### Step 7 — Update Middleware for NextAuth Sessions

**File**: `src/middleware.ts` [MODIFY]

Add NextAuth session check alongside the existing Supabase session check. Since we run both auth systems, we check either session:

```typescript
import { auth } from '@/lib/auth';
// Add to PUBLIC_ROUTES:
// '/api/auth' is already there - NextAuth routes are automatically handled
```

> **CRITICAL GOTCHA**: Do NOT replace the existing `updateSession` call from Supabase. Both sessions must coexist. Users who login via Supabase demo buttons use Supabase sessions. Users who login via Azure AD use NextAuth sessions. The role-based redirect logic should remain unchanged because we upsert the role into the Supabase `profiles` table on Azure login.

---

## FEATURE 5.2 — Email & Microsoft Teams Integration

### Overview

- **Email**: Implement Resend email sending for 4 events: goal submission, goal approval, goal return, check-in reminder.
- **Teams**: Send Adaptive Card notifications via a Teams Incoming Webhook URL (stored as env variable). No bot registration needed.

### Step 1 — Environment Variables

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=AtomQuest <notifications@yourdomain.com>
TEAMS_WEBHOOK_URL=https://your-org.webhook.office.com/webhookb2/...
```

### Step 2 — Implement Email Templates Using react-email

**File**: `src/emails/templates/goal-submitted.tsx` [NEW]

```tsx
import { Html, Head, Body, Container, Text, Heading, Hr, Button } from '@react-email/components';

interface GoalSubmittedEmailProps {
  managerName: string;
  employeeName: string;
  goalCount: number;
  cycleName: string;
  appUrl: string;
  approvalLink: string;
}

export function GoalSubmittedEmail({ managerName, employeeName, goalCount, cycleName, appUrl, approvalLink }: GoalSubmittedEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f4f4f5', fontFamily: 'sans-serif' }}>
        <Container style={{ backgroundColor: '#ffffff', margin: '40px auto', padding: '32px', borderRadius: '8px', maxWidth: '520px' }}>
          <Heading style={{ color: '#09090b', fontSize: '20px', marginBottom: '8px' }}>
            Goal Sheet Submitted for Review
          </Heading>
          <Text style={{ color: '#71717a' }}>Hi {managerName},</Text>
          <Text style={{ color: '#3f3f46' }}>
            <strong>{employeeName}</strong> has submitted their goal sheet ({goalCount} goals) for <strong>{cycleName}</strong> and it is pending your approval.
          </Text>
          <Button href={approvalLink} style={{ backgroundColor: '#09090b', color: '#ffffff', padding: '12px 20px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}>
            Review Goals →
          </Button>
          <Hr style={{ margin: '24px 0', borderColor: '#e4e4e7' }} />
          <Text style={{ color: '#a1a1aa', fontSize: '12px' }}>Orbit by Atomberg · {appUrl}</Text>
        </Container>
      </Body>
    </Html>
  );
}
```

Create similarly structured files for:
- `src/emails/templates/goal-approved.tsx` — notifies employee their goals were approved
- `src/emails/templates/goal-returned.tsx` — notifies employee their goals were returned with a manager comment
- `src/emails/templates/checkin-reminder.tsx` — reminds employee to submit their quarterly check-in

All templates follow the same pattern: import from `@react-email/components`, accept typed props, return JSX.

### Step 3 — Rewrite the Email Send Utility

**File**: `src/emails/send.ts` [OVERWRITE COMPLETELY]

```typescript
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { GoalSubmittedEmail } from './templates/goal-submitted';
import { GoalApprovedEmail } from './templates/goal-approved';
import { GoalReturnedEmail } from './templates/goal-returned';
import { CheckinReminderEmail } from './templates/checkin-reminder';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || 'AtomQuest <notifications@atomquest.demo>';
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

async function send(to: string, subject: string, html: string) {
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
  to: string; managerName: string; employeeName: string; goalCount: number; cycleName: string;
}) {
  const html = render(<GoalSubmittedEmail {...params} appUrl={APP_URL} approvalLink={`${APP_URL}/manager/approvals`} />);
  await send(params.to, `${params.employeeName} submitted their goal sheet`, html);
}

export async function sendGoalApprovedEmail(params: {
  to: string; employeeName: string; cycleName: string;
}) {
  const html = render(<GoalApprovedEmail {...params} appUrl={APP_URL} goalsLink={`${APP_URL}/employee/goals`} />);
  await send(params.to, 'Your goal sheet has been approved', html);
}

export async function sendGoalReturnedEmail(params: {
  to: string; employeeName: string; cycleName: string; managerComment: string;
}) {
  const html = render(<GoalReturnedEmail {...params} appUrl={APP_URL} goalsLink={`${APP_URL}/employee/goals`} />);
  await send(params.to, 'Your goal sheet requires revision', html);
}

export async function sendCheckinReminderEmail(params: {
  to: string; employeeName: string; quarter: string; deadline: string;
}) {
  const html = render(<CheckinReminderEmail {...params} appUrl={APP_URL} checkinsLink={`${APP_URL}/employee/check-ins`} />);
  await send(params.to, `Action required: ${params.quarter} check-in due ${params.deadline}`, html);
}
```

> **GOTCHA**: `render` from `@react-email/render` returns a `Promise<string>` in newer versions. Always `await` it.

### Step 4 — Wire Emails to Actions

**File**: `src/actions/goals.ts` [MODIFY — find the submitGoalSheet server action]

After the Supabase update to change goal status to `submitted`, add:

```typescript
// Fetch manager's email to notify them
const { data: managerProfile } = await supabase
  .from('profiles')
  .select('email, first_name, last_name')
  .eq('id', currentUser.manager_id)
  .single();

if (managerProfile?.email) {
  await sendGoalSubmittedEmail({
    to: managerProfile.email,
    managerName: `${managerProfile.first_name} ${managerProfile.last_name}`,
    employeeName: `${currentUser.first_name} ${currentUser.last_name}`,
    goalCount: goals.length,
    cycleName: cycle.name,
  });
}
```

Do the same for `approveGoals` and `returnGoals` server actions — send the relevant email to the employee after the DB update.

### Step 5 — Microsoft Teams Adaptive Card Notifications

**File**: `src/lib/teams.ts` [NEW]

```typescript
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

// Convenience wrappers
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
```

> **NOTE on Deep Links**: The `actionUrl` in the Teams card IS the deep link. When a manager clicks "Review in Orbit" from within Teams, they are taken directly to `/manager/approvals`. This requires the app to be publicly accessible (i.e., deployed, not localhost). For demo purposes, this will just show the URL.

Call `notifyManagerGoalSubmitted(...)` from the same `submitGoalSheet` server action after sending the email.

### Step 6 — Admin UI: Email/Teams Config Panel

**File**: `src/app/(dashboard)/admin/notifications/page.tsx` [NEW]

This is a simple read-only status page that shows which notification channels are active:

```tsx
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Notifications — Admin | AtomQuest' };

export default async function NotificationsPage() {
  const hasEmail = !!process.env.RESEND_API_KEY;
  const hasTeams = !!process.env.TEAMS_WEBHOOK_URL;
  const hasSSO = !!(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="font-page-title text-page-title text-zinc-900 mb-2">Integrations & Notifications</h2>
      <p className="font-body-sm text-zinc-500 mb-8">Status of active third-party integrations.</p>
      <div className="space-y-4">
        {[
          { label: 'Email (Resend)', active: hasEmail, detail: hasEmail ? 'Sending live emails' : 'RESEND_API_KEY not configured — using stub logs' },
          { label: 'Microsoft Teams', active: hasTeams, detail: hasTeams ? 'Webhook active' : 'TEAMS_WEBHOOK_URL not configured' },
          { label: 'Microsoft Entra SSO', active: hasSSO, detail: hasSSO ? 'Azure AD configured' : 'AZURE_AD_* env variables not configured' },
        ].map(item => (
          <div key={item.label} className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-table-cell-primary text-zinc-900">{item.label}</p>
              <p className="font-caption text-zinc-500 mt-0.5">{item.detail}</p>
            </div>
            <span className={`w-2.5 h-2.5 rounded-full ${item.active ? 'bg-green-500' : 'bg-zinc-300'}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

Add this page to the Admin sidebar by updating the `ADMIN_NAV_ITEMS` in `src/components/layout/sidebar.tsx`.

---

## Common Mistakes to Avoid

| Mistake | Correct Approach |
|---|---|
| Using `avatar_url` in any profiles query | Column does not exist. Use `ui-avatars.com` with `first_name + last_name` instead |
| Calling `render()` without await | Always `await render(...)` from `@react-email/render` |
| Putting Server Actions in Client Components | Extract into a separate `.tsx` file with no `'use client'` directive |
| Replacing Supabase Auth with NextAuth entirely | Both must coexist. Supabase handles demo logins, NextAuth handles Azure SSO |
| Querying `profiles` with `profiles:profile_id(...)` alias syntax | Use direct `profiles(id, first_name, ...)` join syntax — aliases break PostgREST |
| Hard navigation after actions in App Router | Use `router.refresh()` for data revalidation, not `window.location.href` |

---

## Verification Steps After Phase 1

1. Run `npx tsc --noEmit` — expect zero errors.
2. Run `npm run build` — expect zero build errors.
3. In browser, go to `/login`. Verify the "Sign in with Microsoft" button appears above the divider.
4. If Azure credentials are configured: click the button, complete OAuth, verify redirect to correct role page.
5. Go to `/admin/notifications` — verify the status panel shows correct active/inactive states.
6. In the employee goals page, submit goals and check server logs for `[Email Stub]` and `[Teams Stub]` messages (confirming wiring is correct even without real API keys).
