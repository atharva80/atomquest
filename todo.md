# AtomQuest — Code Generation TODO

> **This file is your step-by-step instruction set.** Follow each micro-phase in order.
> Each step tells you exactly which file to generate, what context to feed, and what edge cases to watch for.

---

## ⚙️ Global Rules (Apply to EVERY file you generate)

### Code Standards
- **TypeScript strict mode** — no `any` types, no `@ts-ignore`
- **All imports use `@/` path aliases** (e.g., `@/lib/utils`, `@/types`)
- **Every exported function has a JSDoc comment** with `@param` and `@returns`
- **Every file starts with `'use server'` or `'use client'` where required** by Next.js App Router
- **Use `async/await`** — never raw `.then()` chains
- **Error handling**: wrap all Server Actions in try/catch using `handleActionError()` from `@/lib/errors`

### Supabase Rules
- **Server Components & Actions**: use `createClient()` from `@/lib/supabase/server` — respects RLS
- **Client Components**: use `createClient()` from `@/lib/supabase/client` — respects RLS
- **System/Admin operations ONLY**: use `createAdminClient()` from `@/lib/supabase/admin` — bypasses RLS
- **NEVER expose the service role key in client code**
- **Always type the client**: `createClient()` returns `SupabaseClient<Database>`

### Validation Rules (Business Logic — CRITICAL)
- Max **8 goals** per employee per cycle
- Each goal's weightage: **minimum 10%**
- Total weightage across all goals: **must equal exactly 100%** before submission
- Goal lifecycle: `draft → submitted → approved/returned → locked`
- After lock, **only admin can unlock** (requires reason, creates audit log entry)
- Shared goals: title & target are **read-only** for recipients; only weightage is editable
- Shared goal achievement **syncs from primary owner** to all recipients

### Progress Score Formulas (MUST be exact)
```
numeric_min / percentage_min: score = achievement / target           (higher is better)
numeric_max / percentage_max: score = target / achievement           (lower is better)
timeline:                     score = deadline >= completion ? 1 : 0 (binary)
zero_based:                   score = achievement === 0 ? 1 : 0     (zero = success)
```
- **Edge case**: if `achievement === 0` for max types → score = `Infinity` → **cap at 1.0**
- **Edge case**: if `target === 0` for min types → score = 0 (avoid division by zero)
- All scores are **clamped between 0 and 1** (0% to 100%)
- Weighted score = `progressScore × (weightage / 100)`
- Overall employee score = `sum of all weighted scores`

---

## 📋 Micro-Phase 1: Foundation Types

### Step 1.1 — `src/types/index.ts`
**What to generate**: All TypeScript enums, type aliases, and composite types.
**Context to feed**: The comment header from `src/types/index.ts`
**Key details**:
- Enums should be `as const` objects (not TS enums) for better Supabase compatibility
- Table row aliases use `Database['public']['Tables']['table_name']['Row']`
- For now, since `src/types/supabase.ts` doesn't exist yet, define the types manually (we'll swap to auto-generated later)
- Include `GoalWithCheckins`, `EmployeeGoalSheet`, `TeamMember`, `ApprovalWithGoals`, `AuditLogEntry`, `EscalationWithUser`
- Include analytics types: `AchievementTrend`, `CompletionHeatmapCell`, `GoalDistribution`, `ManagerEffectiveness`

### Step 1.2 — `src/lib/constants.ts`
**What to generate**: All app constants.
**Context to feed**: Comment header + the types from Step 1.1
**Key details**:
- `VALIDATION.MAX_GOALS_PER_EMPLOYEE = 8`
- `VALIDATION.MIN_WEIGHTAGE_PER_GOAL = 10`
- `VALIDATION.TOTAL_WEIGHTAGE = 100`
- `QUARTER_MONTHS`: Q1=Jul-Sep, Q2=Oct-Dec, Q3=Jan-Mar, Q4=Apr-Jun
- `NAV_ITEMS`: must include icon names from `lucide-react` (e.g., `LayoutDashboard`, `Target`, `ClipboardCheck`)
- `STATUS_COLORS`: map each GoalStatus and ProgressStatus to Tailwind classes
- `UOM_TYPES` array: each entry has `value`, `label`, `description`

### Step 1.3 — `src/lib/errors.ts`
**What to generate**: `AppError` class, `ActionResult<T>` type, `handleActionError()` function.
**Context to feed**: Comment header
**Key details**:
- `ActionResult<T>` = `{ success: true; data: T } | { success: false; error: string; fieldErrors?: Record<string, string[]> }`
- `handleActionError` must handle: `ZodError` (extract field errors), `AppError` (return message), unknown (log + generic message)
- `AppError` has: `code: string`, `message: string`, `statusCode: number`

### Step 1.4 — `src/lib/utils.ts`
**What to generate**: Add utility functions to the existing file (which already has the `cn()` function from shadcn).
**Context to feed**: Comment header + types from Step 1.1 + constants from Step 1.2
**IMPORTANT**: Do NOT overwrite the existing `cn()` function. ADD to the file.
**Key details**:
- `calculateProgressScore(uomType, target, achievement)`: implements ALL score formulas above with edge cases
- `getWeightedScore(progressScore, weightage)`: `progressScore * (weightage / 100)`
- `getOverallScore(goals)`: sum of all weighted scores for an employee
- `validateWeightage(goals)`: checks sum === 100 and each >= 10
- `formatQuarterRange(quarter, cycle)`: returns human-readable date range
- `getInitials(name)`: returns first letter of first and last name
- Edge cases: division by zero, null/undefined achievement, timeline date comparison

---

## 📋 Micro-Phase 2: Validation Schemas

### Step 2.1 — `src/schemas/goal.ts`
**Context**: Comment header + types from 1.1 + constants from 1.2
**Key details**:
- `createGoalSchema`: UoM-dependent target validation (use `.superRefine()` for conditional logic)
  - `timeline` → target should be a date string
  - `zero_based` → target should be 0 or omitted
  - All others → target is `z.number().positive()`
- `goalSheetSchema`: `.refine()` checks total weightage === 100 AND goals.length <= 8

### Step 2.2 — `src/schemas/check-in.ts`
**Context**: Comment header + types
**Key details**:
- `actual_achievement` for zero_based should allow 0 as valid (use `.min(0)` not `.positive()`)
- `batchCheckinSchema`: all goals for a quarter submitted at once

### Step 2.3 — `src/schemas/cycle.ts`
**Context**: Comment header
**Key details**:
- Validate all quarter dates fall within cycle start/end range
- Quarters must not overlap
- `end_date > start_date` refinement

### Step 2.4 — `src/schemas/approval.ts`
**Context**: Comment header
**Key details**:
- When `action === 'returned'`, comment is REQUIRED (`.refine()`)
- `goal_edits` array: if present, validate that edited weightages still sum to 100

### Step 2.5 — `src/schemas/user.ts`
**Context**: Comment header
**Key details**:
- `manager_id` is nullable (top-level managers have no manager)
- `employee_code` is optional

---

## 📋 Micro-Phase 3: Supabase Client Layer

### Step 3.1 — `src/lib/supabase/client.ts`
**Context**: Comment header
**Generate**: Browser client using `createBrowserClient` from `@supabase/ssr`
**Key**: Uses `NEXT_PUBLIC_` env vars only

### Step 3.2 — `src/lib/supabase/server.ts`
**Context**: Comment header
**Generate**: Server client using `createServerClient` from `@supabase/ssr`
**Key**: Must use `await cookies()` from `next/headers`. The function must be `async`.

### Step 3.3 — `src/lib/supabase/admin.ts`
**Context**: Comment header
**Generate**: Admin client using `createClient` from `@supabase/supabase-js` (NOT `@supabase/ssr`)
**Key**: Uses `SUPABASE_SERVICE_ROLE_KEY` (server-only). Set `auth: { persistSession: false, autoRefreshToken: false }`

### Step 3.4 — `src/lib/supabase/middleware.ts`
**Context**: Comment header
**Generate**: Middleware helper that refreshes the session token

### Step 3.5 — `middleware.ts` (root)
**Context**: Comment header from `middleware.ts`
**Generate**: Next.js middleware for auth + route protection
**Key details**:
- Public routes: `/login`, `/callback`, `/api/cron/*`
- Protected routes: everything under `/(dashboard)/*`
- Role-based redirect: after login, redirect to `/employee`, `/manager`, or `/admin` based on profile role
- Must call the Supabase middleware helper to refresh tokens

---

## 📋 Micro-Phase 4: Database Schema

### Step 4.1 — `supabase/migrations/00001_initial_schema.sql`
**Context**: Comment header + ALL types from Step 1.1 (for enum values and table structure)
**This is the MOST CRITICAL file. Generate carefully.**

**Must include in this exact order**:
1. **Extensions**: `uuid-ossp`, `pgcrypto`
2. **Custom enums** (7): `user_role`, `goal_status`, `uom_type`, `progress_status`, `quarter_type`, `escalation_type`, `approval_action`
3. **Tables** (12 — in FK dependency order):
   - `departments` (no FK deps)
   - `profiles` (FK → departments, self-ref manager_id)
   - `cycles` (no FK deps)
   - `thrust_areas` (no FK deps)
   - `goals` (FK → profiles, cycles, thrust_areas)
   - `shared_goals` (FK → goals, profiles)
   - `quarterly_checkins` (FK → goals)
   - `manager_comments` (FK → profiles, cycles)
   - `approvals` (FK → profiles, cycles)
   - `escalations` (FK → profiles)
   - `audit_logs` (FK → profiles, goals)
   - `escalation_rules` (no FK deps)
4. **Indexes** on all foreign keys + status columns + commonly filtered fields
5. **RLS Policies** for EVERY table:
   - Enable RLS: `ALTER TABLE tablename ENABLE ROW LEVEL SECURITY;`
   - `profiles`: users see own profile; managers see team; admin sees all
   - `goals`: employees see own; managers see team's; admin sees all
   - `quarterly_checkins`: same as goals
   - `approvals`: managers see their team's; admin sees all
   - `escalations`: managers see own; admin sees all
   - `audit_logs`: admin only
   - `cycles`, `thrust_areas`, `departments`: all authenticated can read; admin can write
   - `escalation_rules`: admin only
   - Use `auth.uid()` and `auth.jwt()->>'role'` in policies (note: role comes from profile, not JWT — query the profiles table in the policy)
6. **Functions** (5 Postgres functions for analytics — called via `rpc()`):
   - `calculate_progress_score(uom_type, target, achievement)` → numeric
   - `get_team_achievement_trend(p_manager_id uuid, p_cycle_id uuid)` → table
   - `get_completion_heatmap(p_cycle_id uuid)` → table
   - `get_goal_distribution(p_department_id uuid, p_cycle_id uuid)` → table
   - `get_manager_effectiveness(p_cycle_id uuid)` → table
7. **Triggers**:
   - `on_auth_user_created`: auto-create a profile row when a new auth user is created (uses `auth.users` trigger)
   - `on_goal_change_after_lock`: if a goal with status='locked' is updated, auto-insert into `audit_logs`

**Edge cases in schema**:
- `goals.weightage`: `CHECK (weightage >= 10 AND weightage <= 100)`
- `goals.target`: can be NULL for zero_based (or store 0)
- `quarterly_checkins`: unique constraint on `(goal_id, quarter)` — one check-in per goal per quarter
- `profiles.manager_id`: nullable (self-referencing FK with ON DELETE SET NULL)
- `escalation_rules.is_active`: boolean default true

### Step 4.2 — `supabase/seed.sql`
**Context**: Comment header + the schema from Step 4.1
**Key details**:
- Use `INSERT INTO auth.users` with `raw_user_meta_data` for creating auth users (Supabase-specific)
- Create 12 users with known passwords (e.g., `password123`) for demo login
- The demo must tell a "mid-flight" story: FY 2025-26, currently in Q2
- All employees have locked goals with Q1 check-ins complete
- 4/7 employees have Q2 check-ins, 3 don't (for escalation demo)
- Include 2-3 shared goals
- Include approval history (submitted → returned → resubmitted → approved → locked)
- Include 3 escalations (1 resolved, 2 active)
- Include 5 audit log entries

---

## 📋 Micro-Phase 5: Generate Supabase Types

### Step 5.1 — Run CLI command (MANUAL — not code gen)
```bash
npx supabase gen types typescript --project-id sdxyohtmgtxwfzhavqdo > src/types/supabase.ts
```
Then go back and update `src/types/index.ts` to import from the generated file.

---

## 📋 Micro-Phase 6: Query Functions (Read Operations)

### Step 6.1 — `src/queries/goals.ts`
**Context**: Comment header + types + supabase server client
**Key details**:
- All queries use `createClient()` from `@/lib/supabase/server` (RLS-respecting)
- `getGoalsByEmployee(cycleId)`: fetches goals with nested `quarterly_checkins` via `.select('*, quarterly_checkins(*)')`
- `getGoalById(goalId)`: single goal with all relations
- `getSharedGoals(cycleId)`: includes primary owner profile
- All functions: handle Supabase error responses (check `error` field)

### Step 6.2 — `src/queries/users.ts`
**Context**: Comment header + types
**Key details**:
- `getCurrentProfile()`: get the logged-in user's profile (uses `supabase.auth.getUser()`)
- `getTeamMembers(managerId)`: all employees where `manager_id = managerId`
- `getAllUsers()`: admin-only, all profiles with department info

### Step 6.3 — `src/queries/cycles.ts`
**Context**: Comment header + types
**Key details**:
- `getActiveCycle()`: returns the cycle where `is_active = true`
- `getCurrentQuarter(cycle)`: compares today's date against cycle quarter windows to determine Q1/Q2/Q3/Q4

### Step 6.4 — `src/queries/check-ins.ts`
**Context**: Comment header + types
**Key details**:
- `getCheckinsByEmployee(employeeId, cycleId)`: all check-ins for an employee's goals
- `getTeamCheckins(managerId, cycleId, quarter)`: team's check-ins for a quarter

### Step 6.5 — `src/queries/analytics.ts`
**Context**: Comment header + types + the Postgres function signatures from Step 4.1
**Key details**:
- These call `supabase.rpc('function_name', { params })` to invoke the Postgres analytics functions
- `getAchievementTrend`, `getCompletionHeatmap`, `getGoalDistribution`, `getManagerEffectiveness`
- `getDashboardStats`: aggregated counts for admin dashboard KPIs

### Step 6.6 — `src/queries/audit.ts`
**Context**: Comment header + types
**Key details**:
- `getAuditLogs(filters)`: paginated, filterable audit logs with profile joins
- Supports: date range, employee filter, action type filter

---

## 📋 Micro-Phase 7: Server Actions (Write Operations)

### Step 7.1 — `src/actions/goals.ts`
**Context**: Comment header + schemas + types + queries + supabase server
**Key details**:
- `'use server'` at top of file
- `createGoal`: validate with Zod → check goal count < 8 → insert → return goal
- `updateGoal`: only if status === 'draft' → validate → update
- `deleteGoal`: only if status === 'draft'
- `submitGoals`: validate total weightage === 100 → update all goals status to 'submitted' → create approval record → send email to manager
- After each mutation: call `revalidatePath()` from `next/cache`

### Step 7.2 — `src/actions/approvals.ts`
**Context**: Comment header + schemas + types + supabase server + emails
**Key details**:
- `approveOrReturnGoalSheet`: if approve → set all goals to 'approved', then 'locked' → create approval record → send email. If return → set all back to 'draft' → create approval record with comment → send email
- `unlockGoalSheet`: admin only → verify caller is admin → update goals to 'draft' → create audit log with reason
- Manager inline edits: apply `goal_edits` (target/weightage changes) BEFORE approving → validate new weightages sum to 100

### Step 7.3 — `src/actions/check-ins.ts`
**Context**: Comment header + schemas + types + supabase server
**Key details**:
- `submitCheckins`: batch upsert — one check-in per goal per quarter (use `upsert` with `onConflict: 'goal_id,quarter'`)
- `submitManagerComment`: insert or update manager comment

### Step 7.4 — `src/actions/cycles.ts`
**Context**: Comment header + schemas + types + supabase admin (admin operations)
**Key details**:
- When setting a cycle as active, ensure all other cycles are deactivated first (only one active cycle)

### Step 7.5 — `src/actions/shared-goals.ts`
**Context**: Comment header + schemas + types
**Key details**:
- `createSharedGoal`: create the template goal for primary owner → create copies for each recipient → link via shared_goals table
- `syncSharedGoalAchievement`: when primary owner submits check-in, sync achievement to all recipients' corresponding check-ins

### Step 7.6 — `src/actions/users.ts`
**Context**: Comment header + schemas + types + supabase admin
**Key details**:
- `updateProfile`: admin can change role, department, manager assignment
- `bulkAssignManager`: admin selects multiple employees → assigns same manager

### Step 7.7 — `src/actions/escalations.ts`
**Context**: Comment header + schemas + types + supabase admin + emails
**Key details**:
- `triggerEscalationCheck`: called by cron → check all active rules → for each rule, find users who violate threshold → create escalation records → send alert emails
- `resolveEscalation`: mark as resolved (sets resolved_at timestamp)
- Uses admin client (bypasses RLS since it's a system operation)

---

## 📋 Micro-Phase 8: Email & Hooks

### Step 8.1 — `src/emails/send.ts`
**Context**: Comment header
**Key details**:
- Wraps `Resend.send()` with error handling
- Gracefully handles missing RESEND_API_KEY (log warning, don't crash)

### Step 8.2 — `src/hooks/use-user.ts`
**Context**: Comment header + types
**Generate**: React context + provider that holds the current user profile and role

### Step 8.3 — `src/hooks/use-realtime.ts`
**Context**: Comment header + supabase client
**Generate**: Hook that subscribes to Supabase realtime changes on a table

### Step 8.4 — `src/hooks/use-query-state.ts`
**Context**: Comment header
**Generate**: Convenience wrappers around `nuqs` for common filter patterns (tab state, search state, pagination)

---

## 📋 Micro-Phase 9: Shared UI Components

### Step 9.1 — `src/components/shared/data-table.tsx`
**Context**: Comment header + shadcn table component
**Key**: Generic, type-safe. Must support sorting, search, pagination, empty state.

### Step 9.2 — `src/components/shared/empty-state.tsx`
### Step 9.3 — `src/components/shared/loading-skeleton.tsx`
### Step 9.4 — `src/components/shared/confirm-dialog.tsx`
### Step 9.5 — `src/components/shared/export-button.tsx`

---

## 📋 Micro-Phase 10: Layout Components

### Step 10.1 — `src/components/layout/sidebar.tsx`
**Context**: Comment header + constants (NAV_ITEMS) + types (UserRole)
**Key**: Must import and render Lucide icons dynamically based on nav item config

### Step 10.2 — `src/components/layout/topbar.tsx`
### Step 10.3 — `src/components/layout/breadcrumbs.tsx`
### Step 10.4 — `src/components/layout/role-switcher.tsx`
**Key**: Critical for demo! Pre-configured demo accounts for each role.

---

## 📋 Micro-Phase 11: Feature Components

### Step 11.1 — Goal components (5 files)
- `goal-form.tsx`: Dynamic UoM field switching is CRITICAL
- `goal-card.tsx`: Status badge colors from STATUS_COLORS constant
- `goal-table.tsx`: Footer row showing total weightage with warning if ≠ 100
- `weightage-bar.tsx`: Animated, color-coded
- `progress-badge.tsx`: SVG circular progress ring

### Step 11.2 — Approval components (3 files)
- `approval-card.tsx`: Expand/collapse animation
- `approval-actions.tsx`: Return requires comment
- `inline-edit-row.tsx`: Click-to-edit with original value tooltip

### Step 11.3 — Check-in components (3 files)
- `check-in-form.tsx`: Live-calculated scores as user types
- `check-in-timeline.tsx`: Visual Q1→Q4 vertical timeline
- `manager-comment.tsx`: Inline add/edit

### Step 11.4 — Analytics components (4 files)
- `achievement-trend.tsx`: Tremor `AreaChart`
- `completion-heatmap.tsx`: Custom CSS grid with color interpolation
- `goal-distribution.tsx`: Tremor `BarList` + `DonutChart`
- `manager-effectiveness.tsx`: Tremor `Table`

### Step 11.5 — Email templates (5 files)
- Use `@react-email/components` (Html, Head, Body, Container, Text, Button)
- Clean, professional design with AtomQuest branding

---

## 📋 Micro-Phase 12: Pages — Auth

### Step 12.1 — `src/app/(auth)/layout.tsx`
**Key**: Premium split-screen layout. Left = gradient with branding. Right = form slot.

### Step 12.2 — `src/app/(auth)/login/page.tsx`
**Key**: Email/password form + "Quick Demo Login" buttons (3 role buttons that auto-fill credentials)

### Step 12.3 — `src/app/(auth)/callback/route.ts`
**Key**: OAuth callback for Azure AD. Exchange code for session.

---

## 📋 Micro-Phase 13: Pages — Dashboard Shell

### Step 13.1 — `src/app/(dashboard)/layout.tsx`
**Context**: Comment header + sidebar + topbar + user hook
**Key**: Fetch user profile → render sidebar + topbar + main content area. Protect route (redirect to /login if no session).

### Step 13.2 — `src/app/page.tsx`
**Key**: Root redirect based on role.

### Step 13.3 — `src/app/globals.css`
**Note**: Already has content — only add if missing the glassmorphism utilities.

---

## 📋 Micro-Phase 14: Pages — Employee

### Step 14.1 — `src/app/(dashboard)/employee/page.tsx` (Dashboard)
### Step 14.2 — `src/app/(dashboard)/employee/goals/page.tsx` (Goals list)
### Step 14.3 — `src/app/(dashboard)/employee/goals/new/page.tsx` (Create goal)
### Step 14.4 — `src/app/(dashboard)/employee/goals/[goalId]/page.tsx` (Goal detail)
### Step 14.5 — `src/app/(dashboard)/employee/check-ins/page.tsx` (Quarterly check-in)

---

## 📋 Micro-Phase 15: Pages — Manager

### Step 15.1 — `src/app/(dashboard)/manager/page.tsx` (Dashboard)
### Step 15.2 — `src/app/(dashboard)/manager/approvals/page.tsx` (Pending approvals)
### Step 15.3 — `src/app/(dashboard)/manager/team/page.tsx` (Team overview)
### Step 15.4 — `src/app/(dashboard)/manager/team/[employeeId]/page.tsx` (Employee detail)
### Step 15.5 — `src/app/(dashboard)/manager/check-ins/page.tsx` (Team check-in review)

---

## 📋 Micro-Phase 16: Pages — Admin

### Step 16.1 — `src/app/(dashboard)/admin/page.tsx` (Dashboard)
### Step 16.2 — `src/app/(dashboard)/admin/cycles/page.tsx` (Cycle CRUD)
### Step 16.3 — `src/app/(dashboard)/admin/users/page.tsx` (User management)
### Step 16.4 — `src/app/(dashboard)/admin/escalations/page.tsx` (Escalation log)
### Step 16.5 — `src/app/(dashboard)/admin/audit/page.tsx` (Audit trail)
### Step 16.6 — `src/app/(dashboard)/admin/shared-goals/page.tsx` (Shared goals)

---

## 📋 Micro-Phase 17: Pages — Analytics & API

### Step 17.1 — `src/app/(dashboard)/analytics/page.tsx`
**Key**: This is the WOW page. 4 tabs with Tremor charts. Must look stunning.

### Step 17.2 — `src/app/api/cron/escalation/route.ts`
**Key**: Verify `CRON_SECRET` header before executing.

### Step 17.3 — `src/app/api/export/route.ts`
**Key**: Role-scoped data export. Returns file as download.

### Step 17.4 — `src/app/api/webhooks/supabase/route.ts` (Optional)

---

## 📋 Micro-Phase 18: Final Polish

### Step 18.1 — Test all role journeys
- Employee: login → create goals → submit → wait for approval → check-in
- Manager: login → review approvals → approve/return → view team → add comments
- Admin: login → manage cycles → view escalations → audit trail → analytics

### Step 18.2 — Verify edge cases
- [ ] Create 9th goal → should be blocked
- [ ] Submit with weightage ≠ 100 → should be blocked
- [ ] Submit with goal weightage < 10 → should be blocked
- [ ] Shared goal: recipient tries to edit title → should be blocked
- [ ] Zero-based UoM: achievement = 0 → score should be 100%
- [ ] Max UoM: achievement = 0 → score should be capped at 100% (not Infinity)
- [ ] Unlock locked goals as admin → audit log created
- [ ] Return for rework without comment → should be blocked

### Step 18.3 — Performance & UX
- [ ] All pages have loading skeletons
- [ ] All pages have empty states
- [ ] All forms show field-level validation errors
- [ ] Toast notifications on success/error for all actions
- [ ] Responsive: works on tablet (1024px) minimum
