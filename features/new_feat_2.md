# AtomQuest — Advanced Features Implementation Plan
## Phase 2: Escalation Module (5.3) + Analytics Module (5.4)

> Read Phase 1 doc first. All gotchas from Phase 1 apply here too.
> Run `npx tsc --noEmit` after each section. Run `npm run build` at the very end.

---

## FEATURE 5.3 — Escalation Module (Rule-Based)

### Overview

The escalation system already has a partial schema:
- `escalation_rules` table: `id, type, days_threshold, is_active`
- `escalations` table: `id, type, cycle_id, target_user_id, escalated_to_id, resolved_at`
- `escalation_type` enum: `goal_not_submitted | goal_not_approved | checkin_not_completed`
- `/api/cron/escalation` route exists but is a stub

We need to:
1. Implement the cron route logic fully
2. Build an Admin UI to manage escalation rules
3. Build the Admin escalation log/tracking view (already partially exists at `/admin/escalations`)

---

### Step 1 — Fully Implement the Cron Escalation Route

**File**: `src/app/api/cron/escalation/route.ts` [OVERWRITE]

```typescript
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { sendEscalationAlertEmail } from '@/emails/send';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = createAdminClient();
  let created = 0;

  try {
    // 1. Get active rules
    const { data: rules } = await supabase
      .from('escalation_rules')
      .select('*')
      .eq('is_active', true);
    if (!rules?.length) return NextResponse.json({ success: true, created: 0 });

    // 2. Get active cycle
    const { data: cycle } = await supabase
      .from('cycles')
      .select('id, name, goal_setting_deadline, q1_end, q2_end, q3_end, q4_end')
      .eq('is_active', true)
      .single();
    if (!cycle) return NextResponse.json({ success: true, created: 0, reason: 'no_active_cycle' });

    const now = new Date();

    for (const rule of rules) {
      const threshold = rule.days_threshold;

      if (rule.type === 'goal_not_submitted') {
        // Find employees with zero submitted/approved goals in current cycle
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name, manager_id, role')
          .eq('role', 'employee');

        const { data: submittedGoals } = await supabase
          .from('goals')
          .select('profile_id')
          .eq('cycle_id', cycle.id)
          .in('status', ['submitted', 'approved']);

        const submittedIds = new Set((submittedGoals || []).map(g => g.profile_id));

        const deadline = new Date(cycle.goal_setting_deadline);
        const daysPastDeadline = Math.floor((now.getTime() - deadline.getTime()) / 86400000);

        if (daysPastDeadline < threshold) continue;

        for (const profile of allProfiles || []) {
          if (submittedIds.has(profile.id)) continue;
          if (!profile.manager_id) continue;

          // Check if escalation already exists (avoid duplicates)
          const { count } = await supabase
            .from('escalations')
            .select('*', { count: 'exact', head: true })
            .eq('type', rule.type)
            .eq('target_user_id', profile.id)
            .eq('cycle_id', cycle.id)
            .is('resolved_at', null);

          if ((count || 0) > 0) continue;

          await supabase.from('escalations').insert({
            type: rule.type,
            cycle_id: cycle.id,
            target_user_id: profile.id,
            escalated_to_id: profile.manager_id,
          });

          // Get manager email
          const { data: manager } = await supabase
            .from('profiles')
            .select('email, first_name, last_name')
            .eq('id', profile.manager_id)
            .single();

          if (manager?.email) {
            await sendEscalationAlertEmail({
              to: manager.email,
              managerName: `${manager.first_name} ${manager.last_name}`,
              employeeName: `${profile.first_name} ${profile.last_name}`,
              escalationType: 'Goal Not Submitted',
              daysPending: daysPastDeadline,
            });
          }
          created++;
        }
      }

      if (rule.type === 'goal_not_approved') {
        // Find submitted goals pending approval for more than threshold days
        const { data: pendingGoals } = await supabase
          .from('goals')
          .select('profile_id, updated_at, profiles(id, email, first_name, last_name, manager_id)')
          .eq('cycle_id', cycle.id)
          .eq('status', 'submitted');

        const seen = new Set<string>();
        for (const goal of pendingGoals || []) {
          const daysPending = Math.floor((now.getTime() - new Date(goal.updated_at).getTime()) / 86400000);
          if (daysPending < threshold) continue;

          const profile = (goal as any).profiles;
          if (!profile || seen.has(profile.id)) continue;
          seen.add(profile.id);
          if (!profile.manager_id) continue;

          const { count } = await supabase
            .from('escalations')
            .select('*', { count: 'exact', head: true })
            .eq('type', rule.type)
            .eq('target_user_id', profile.id)
            .eq('cycle_id', cycle.id)
            .is('resolved_at', null);

          if ((count || 0) > 0) continue;

          await supabase.from('escalations').insert({
            type: rule.type,
            cycle_id: cycle.id,
            target_user_id: profile.id,
            escalated_to_id: profile.manager_id,
          });
          created++;
        }
      }

      if (rule.type === 'checkin_not_completed') {
        // Determine active quarter window
        const quarterWindows = [
          { q: 'Q1', end: cycle.q1_end },
          { q: 'Q2', end: cycle.q2_end },
          { q: 'Q3', end: cycle.q3_end },
          { q: 'Q4', end: cycle.q4_end },
        ];
        const activeQ = quarterWindows.find(w => {
          const end = new Date(w.end);
          const daysAfterEnd = Math.floor((now.getTime() - end.getTime()) / 86400000);
          return daysAfterEnd >= 0 && daysAfterEnd >= threshold;
        });
        if (!activeQ) continue;

        // Find approved goals with no check-in in active quarter
        const { data: approvedGoals } = await supabase
          .from('goals')
          .select('id, profile_id, profiles(id, email, first_name, last_name, manager_id)')
          .eq('cycle_id', cycle.id)
          .eq('status', 'approved');

        const goalIds = (approvedGoals || []).map(g => g.id);
        if (!goalIds.length) continue;

        const { data: checkins } = await supabase
          .from('quarterly_checkins')
          .select('goal_id')
          .in('goal_id', goalIds)
          .eq('quarter', activeQ.q);

        const checkedInGoalIds = new Set((checkins || []).map(c => c.goal_id));
        const seen = new Set<string>();

        for (const goal of approvedGoals || []) {
          if (checkedInGoalIds.has(goal.id)) continue;
          const profile = (goal as any).profiles;
          if (!profile || seen.has(profile.id)) continue;
          seen.add(profile.id);
          if (!profile.manager_id) continue;

          const { count } = await supabase
            .from('escalations')
            .select('*', { count: 'exact', head: true })
            .eq('type', rule.type)
            .eq('target_user_id', profile.id)
            .eq('cycle_id', cycle.id)
            .is('resolved_at', null);

          if ((count || 0) > 0) continue;

          await supabase.from('escalations').insert({
            type: rule.type,
            cycle_id: cycle.id,
            target_user_id: profile.id,
            escalated_to_id: profile.manager_id,
          });
          created++;
        }
      }
    }

    return NextResponse.json({ success: true, created });
  } catch (error) {
    console.error('[Escalation Cron] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
```

> **GOTCHA**: The `profiles(...)` join in the goals query uses the direct relation syntax (no alias). If it returns `null`, the join failed silently — add a `console.error` and `continue` guard.

> **GOTCHA**: `sendEscalationAlertEmail` signature must be updated in `src/emails/send.ts` to accept an object param `{ to, managerName, employeeName, escalationType, daysPending }` instead of positional args.

---

### Step 2 — Admin Escalation Rules Manager UI

**File**: `src/app/(dashboard)/admin/escalations/page.tsx` [OVERWRITE]

This page must:
1. Show the current escalation rules with their thresholds
2. Allow toggling rules on/off
3. Show the live escalation log (target user, type, escalated to, created date, resolved status)
4. Allow admin to mark an escalation as resolved

Since this page needs both read and interactive actions, split it:
- `page.tsx` — Server Component that fetches data
- `client-page.tsx` — Client Component for interactivity

**page.tsx**:
```typescript
import { createClient } from '@/lib/supabase/server';
import { EscalationsClientPage } from './client-page';

export const metadata = { title: 'Escalations — Admin | AtomQuest' };

export default async function EscalationsPage() {
  const supabase = await createClient();

  const [{ data: rules }, { data: escalations }] = await Promise.all([
    supabase.from('escalation_rules').select('*').order('type'),
    supabase
      .from('escalations')
      .select(`
        *,
        target: profiles!escalations_target_user_id_fkey(id, first_name, last_name, email),
        escalated_to: profiles!escalations_escalated_to_id_fkey(id, first_name, last_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  return <EscalationsClientPage rules={rules || []} escalations={escalations || []} />;
}
```

> **GOTCHA**: The `escalations` table has TWO foreign keys to `profiles` (`target_user_id` and `escalated_to_id`). When joining both in the same query, PostgREST requires you to disambiguate using the FK constraint name. Use `profiles!escalations_target_user_id_fkey` and `profiles!escalations_escalated_to_id_fkey` exactly as shown.

**client-page.tsx**: Build a two-section layout:
- Top: Rules cards with threshold and an on/off toggle (calls a server action `toggleEscalationRule(id, is_active)`)
- Bottom: Escalation log table with columns: Employee | Type (formatted) | Escalated To | Date | Status | Action

The "Resolve" button calls server action `resolveEscalation(id)` which sets `resolved_at = now()`.

**File**: `src/actions/escalations.ts` [ADD these exports]

```typescript
'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleEscalationRule(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('escalation_rules')
    .update({ is_active: isActive })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/escalations');
  return { success: true };
}

export async function resolveEscalation(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('escalations')
    .update({ resolved_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/escalations');
  return { success: true };
}
```

---

## FEATURE 5.4 — Analytics Module

### Overview

The analytics page at `/analytics` already exists with **hardcoded mock data**. The database already has four Postgres functions:
- `get_team_achievement_trend(p_cycle_id, p_manager_id)` — QoQ trend
- `get_completion_heatmap(p_cycle_id)` — Dept × Quarter completion rates
- `get_goal_distribution(p_cycle_id, p_department_id)` — Breakdown by thrust area
- `get_manager_effectiveness(p_cycle_id)` — Manager comparison table

**Goal**: Replace all mock data with real Supabase RPC calls.

---

### Step 1 — Create Analytics Server Query File

**File**: `src/queries/analytics.ts` [NEW]

```typescript
import { createClient } from '@/lib/supabase/server';

export async function getAchievementTrend(cycleId: string, managerId: string | null) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_team_achievement_trend', {
    p_cycle_id: cycleId,
    p_manager_id: managerId,
  });
  if (error) { console.error('[Analytics] trend error:', error); return []; }
  return data || [];
}

export async function getCompletionHeatmap(cycleId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_completion_heatmap', {
    p_cycle_id: cycleId,
  });
  if (error) { console.error('[Analytics] heatmap error:', error); return []; }
  return data || [];
}

export async function getGoalDistribution(cycleId: string, departmentId: string | null) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_goal_distribution', {
    p_cycle_id: cycleId,
    p_department_id: departmentId,
  });
  if (error) { console.error('[Analytics] distribution error:', error); return []; }
  return data || [];
}

export async function getManagerEffectiveness(cycleId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_manager_effectiveness', {
    p_cycle_id: cycleId,
  });
  if (error) { console.error('[Analytics] effectiveness error:', error); return []; }
  return data || [];
}
```

> **IMPORTANT**: These are server-side queries using `createClient` from `@/lib/supabase/server`. They cannot be called from Client Components directly.

---

### Step 2 — Convert Analytics Page to Server Component

**File**: `src/app/(dashboard)/analytics/page.tsx` [OVERWRITE]

Convert from `'use client'` to a Server Component. Move all data fetching here and pass data as props to client components.

```typescript
// NO 'use client' directive — this is a Server Component
import { getActiveCycle } from '@/queries/cycles';
import { getAchievementTrend, getCompletionHeatmap, getGoalDistribution, getManagerEffectiveness } from '@/queries/analytics';
import { createClient } from '@/lib/supabase/server';
import { AnalyticsClientPage } from './client-page';

export const metadata = { title: 'Analytics — AtomQuest' };

export default async function AnalyticsPage() {
  const cycle = await getActiveCycle();

  if (!cycle) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h2 className="font-page-title text-page-title text-zinc-900">Corporate Performance Analytics</h2>
        <p className="text-zinc-500 mt-4">No active performance cycle found. Please activate a cycle first.</p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role, id').eq('id', user!.id).single();

  // Managers only see their team data; admins see org-wide
  const managerId = profile?.role === 'manager' ? profile.id : null;

  // Fetch all analytics data in parallel
  const [trendData, heatmapData, distributionData, managerData] = await Promise.all([
    getAchievementTrend(cycle.id, managerId),
    getCompletionHeatmap(cycle.id),
    getGoalDistribution(cycle.id, null),
    getManagerEffectiveness(cycle.id),
  ]);

  // Extract unique departments and quarters from heatmap data
  const departments = [...new Set(heatmapData.map((d: any) => d.department))];
  const quarters = [...new Set(heatmapData.map((d: any) => d.quarter))] as ('Q1'|'Q2'|'Q3'|'Q4')[];

  return (
    <AnalyticsClientPage
      trendData={trendData}
      heatmapData={heatmapData}
      distributionData={distributionData}
      managerData={managerData}
      departments={departments}
      quarters={quarters}
      cycleName={cycle.name}
    />
  );
}
```

---

### Step 3 — Create Analytics Client Page

**File**: `src/app/(dashboard)/analytics/client-page.tsx` [NEW]

```tsx
'use client';

import { useState } from 'react';
import { AchievementTrendChart } from '@/components/analytics/achievement-trend';
import { CompletionHeatmap } from '@/components/analytics/completion-heatmap';
import { GoalDistributionChart } from '@/components/analytics/goal-distribution';
import { ManagerEffectivenessTable } from '@/components/analytics/manager-effectiveness';

interface Props {
  trendData: any[];
  heatmapData: any[];
  distributionData: any[];
  managerData: any[];
  departments: string[];
  quarters: ('Q1'|'Q2'|'Q3'|'Q4')[];
  cycleName: string;
}

const TABS = ['Overview', 'Department Trends', 'Completion Heatmap', 'Manager Metrics'];

export function AnalyticsClientPage({ trendData, heatmapData, distributionData, managerData, departments, quarters, cycleName }: Props) {
  const [activeTab, setActiveTab] = useState('Overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-zinc-200 rounded-lg p-5">
              <h3 className="font-section-label text-section-label tracking-widest text-zinc-500 uppercase mb-4">Quarterly Progress Trend</h3>
              <AchievementTrendChart data={trendData} />
            </div>
            <div className="bg-white border border-zinc-200 rounded-lg p-5">
              <h3 className="font-section-label text-section-label tracking-widest text-zinc-500 uppercase mb-4">Dept Completion Heatmap</h3>
              <CompletionHeatmap data={heatmapData} departments={departments} quarters={quarters} />
            </div>
          </div>
        );
      case 'Department Trends':
        return <GoalDistributionChart data={distributionData} groupBy="thrust_area" />;
      case 'Completion Heatmap':
        return <CompletionHeatmap data={heatmapData} departments={departments} quarters={quarters} />;
      case 'Manager Metrics':
        return <ManagerEffectivenessTable data={managerData} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-950 font-page-title">Corporate Performance Analytics</h2>
        <p className="text-sm text-zinc-500 font-body-relaxed mt-1">Cycle: {cycleName}</p>
      </div>
      <div className="flex items-center gap-1 border-b border-zinc-200">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors font-body-sm ${activeTab === tab ? 'text-zinc-950 border-b-2 border-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            {tab}
          </button>
        ))}
      </div>
      {trendData.length === 0 && activeTab === 'Overview' && (
        <div className="text-center py-12 text-zinc-400">
          <p>No check-in data yet for this cycle. Analytics will populate as employees complete their quarterly check-ins.</p>
        </div>
      )}
      {renderContent()}
    </div>
  );
}
```

---

### Step 4 — Update ManagerEffectivenessTable Props

The existing `ManagerEffectivenessTable` component likely expects data in the format from the mock. The real RPC returns:
```
{ manager_id, first_name, last_name, check_in_completion_rate, avg_team_score }
```

Update the component at `src/components/analytics/manager-effectiveness.tsx` to accept this shape directly. Remove any wrapping `{ manager: { first_name, ... } }` nesting that was used in the mock.

---

### Step 5 — Add Department Filter (Optional Enhancement)

For the Goal Distribution tab, add a department selector dropdown. Fetch departments from Supabase in the server page and pass as a prop. In the client page, the selected department triggers a server-side re-render using `nuqs` (already installed) URL search params — this avoids client-side fetching entirely.

In `client-page.tsx`:
```tsx
import { useQueryState } from 'nuqs';
// ...
const [deptId, setDeptId] = useQueryState('dept');
```

Then in `page.tsx`, read `searchParams.dept` and pass it to `getGoalDistribution(cycle.id, searchParams.dept ?? null)`.

---

## Verification Steps After Phase 2

1. Run `npx tsc --noEmit` — zero errors.
2. Run `npm run build` — confirm the analytics route still compiles (it's now a Server Component, not `'use client'`).
3. Login as Admin → go to `/admin/escalations`. Verify rules are listed.
4. Toggle a rule off → rule should immediately update (no page reload — use `router.refresh()` in the client component after calling the server action).
5. Login as Admin → go to `/analytics`. Verify charts render with real data from Supabase (not mock data). If no check-in data exists yet, the empty state message should show.
6. Login as Manager → go to `/analytics`. Verify that `managerId` is passed correctly and trend data is scoped to their team.
7. Trigger the escalation cron via the Force Trigger button at `/admin/escalations`. Check that:
   - New escalation rows appear in the log table.
   - Server logs show `[Email Stub]` messages for affected employees.

---

## Final Build Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run build` completes successfully
- [ ] No `any` types introduced without comment justification
- [ ] All server actions use `revalidatePath` after mutations
- [ ] All Supabase joins use direct table name syntax (no `:alias` syntax)
- [ ] All `render()` calls from `@react-email/render` are awaited
- [ ] `'use client'` is only on leaf components that use hooks/browser APIs
- [ ] No `window.location.href` in Server Components or Server Actions (use `redirect()` from `next/navigation`)
