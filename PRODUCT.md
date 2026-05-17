# Orbit — Goal Tracking Platform by Atomberg

## Product

**Name:** Orbit  
**Tagline:** Your goals, in orbit.  
**Owner:** Atomberg Technologies  
**Type:** Internal web application (not a marketing site)  
**Register:** Product — design serves the workflow, not the brand moment

Orbit is Atomberg's in-house goal-setting and performance tracking platform.
Employees create and submit goals, managers approve and review them, and HR
oversees org-wide completion across quarterly check-in cycles.

---

## Audience

**Primary users:**
- Atomberg employees (non-technical) — setting goals, logging quarterly achievements
- Managers (L1) — reviewing teams, approving goals, writing check-in comments
- HR / Admin — cycle configuration, org oversight, exception handling

**User mindset:** Task-oriented. They open Orbit to complete a specific action
(submit goals, approve a team member, log Q2 achievement) and leave. They are
not browsing. Every screen should reduce friction for that single action.

**Technical literacy:** Low to medium. No jargon. Error messages must explain
what went wrong and what to do next — never raw validation strings.

**Device:** Desktop-first (office environment), responsive to tablet.

---

## Brand Personality

- **Precise** — Atomberg is an engineering company. Numbers matter. Percentages,
  targets, and scores should always be exact and clearly labelled.
- **Calm** — Not playful, not corporate-stiff. Neutral, focused, professional.
  The UI should feel like a well-designed internal tool, not a consumer app.
- **Trustworthy** — Goal data feeds appraisals. The UI must signal reliability.
  Locked states, audit trails, and confirmation dialogs communicate seriousness.
- **Efficient** — Atomberg builds energy-efficient hardware. The software should
  feel the same — fast, no wasted motion, no decorative chrome.

---

## Visual Direction

**Metaphor:** Orbital mechanics. Goals orbit the company's core priorities, the
way electrons orbit a nucleus, the way satellites orbit a planet. Motion is
purposeful and in-system, not chaotic.

**Feeling to achieve:** Linear, precise, enterprise-grade. Like Vercel's
dashboard crossed with a clean Indian SaaS product. Nothing generic.

**Color system:**
- Primary action: Blue (`#378ADD` / `blue-500` range) — trust, precision
- On track: Emerald (`#10b981`) — forward motion
- At risk: Amber (`#f59e0b`) — caution, not alarm
- Overdue / blocked: Red (`#ef4444`) — clear signal
- Neutral surfaces: Slate grays — never pure black or white
- Atomberg brand accent: Use sparingly as a highlight, not a fill

**Typography:**
- Font: Inter (already loaded, universally readable, engineering-adjacent)
- Page titles: `text-2xl font-semibold tracking-tight`
- Section labels: `text-sm font-medium text-muted-foreground uppercase tracking-wide`
- Data values: `tabular-nums` always — numbers must align in tables
- Body: `text-sm leading-relaxed` — readable at desk distance

**Density:** Medium-high. Dashboards show real data, not marketing copy.
Tables, stat cards, and progress bars are the primary UI surface. Generous
enough to breathe, dense enough to show meaningful information per screen.

---

## Anti-References

These are aesthetics Orbit must never resemble:

- **Generic purple-gradient SaaS** — Notion-alikes, Loom-alikes, any hero with
  a blurred purple blob behind a laptop mockup
- **Consumer fintech warmth** — Rounded bubbly cards, pastel fills, friendly
  illustrations of people high-fiving
- **Dark mode neon dashboards** — Neon line charts on pure black with glow effects
- **Overcrowded ERP UIs** — Odoo, SAP, legacy HR tools with 40 fields per form
- **Marketing-site energy inside the app** — Large hero text, scroll animations,
  gradient CTAs inside authenticated pages

---

## Component Conventions

These are established patterns. Do not redesign them; enforce them:

**Status badges:**
```
on_track   → bg-emerald-50  text-emerald-700  border-emerald-200
at_risk    → bg-amber-50    text-amber-700    border-amber-200
not_started→ bg-slate-50    text-slate-600    border-slate-200
completed  → bg-blue-50     text-blue-700     border-blue-200
overdue    → bg-red-50      text-red-600      border-red-200
```
Always `text-xs font-medium px-2.5 py-0.5 rounded-full border` — never pill
buttons, never filled without border.

**Progress bars:**
- Height: `h-1.5` — thin, precise, not chunky
- Color: emerald ≥80%, amber 50–79%, red <50%
- Always paired with a `tabular-nums` percentage label on the right
- Never animated on load — values are factual, not celebratory

**Stat cards (dashboard):**
- White bg, `0.5px border`, `border-radius-lg`, `p-5`
- Muted label above (13px), large value below (24px/500 weight)
- Icon in a tinted square (10% opacity bg, matching icon color) — top right
- Delta row at bottom: green for improvement, red for regression, muted for flat

**Tables:**
- `text-sm` throughout
- `font-medium` on primary identifiers (employee name, goal title)
- `text-muted-foreground` on secondary columns (dates, IDs)
- `tabular-nums` on all numeric columns
- Sticky header on scroll — data tables are the primary UI, treat them seriously
- Row hover: `bg-muted/40` — subtle, not a full highlight

**Forms:**
- shadcn Form + react-hook-form + Zod only
- Inline validation — errors appear beneath the field, not in a toast
- Weightage field: always shows running total with a live donut indicator
- Submit disabled until all required fields pass validation
- Destructive actions (unlock, delete) require a confirmation dialog — never
  a single click

**Empty states:**
- Every empty view: icon (Lucide, 40px, muted color) + heading + 1-line description + CTA
- Never show a blank white box — empty is a designed state

**Loading:**
- Skeleton screens always — never spinners, never blank pages
- Skeleton matches the shape of the real content (card skeletons for cards,
  row skeletons for tables)

---

## Key Workflows (Design Must Support These)

1. **Goal creation** — Employee fills title, thrust area, UoM, target, weightage.
   Live weightage donut shows remaining %. Form blocks submission if total ≠ 100%.
   Max 8 goals. Min 10% per goal.

2. **Manager approval** — Manager sees pending goals per employee. Can inline-edit
   targets and weightages before approving. Can return for rework with a comment.
   After approval, goals lock — no employee edits.

3. **Quarterly check-in** — Employee logs actual achievement vs planned target.
   Progress score auto-calculates by UoM type. Status dropdown (Not Started /
   On Track / Completed). Manager then reviews and adds a structured comment.

4. **Analytics dashboard** — HR sees org-wide completion heatmap, manager
   effectiveness rates, QoQ trend charts. Data is pre-computed — never a slow query.

---

## Constraints

- **shadcn/ui + Tailwind CSS** — no other component library
- **Server Components by default** — `"use client"` only when hooks or browser
  APIs are required
- **No inline styles** — Tailwind classes only
- **No gradients** — flat surfaces, semantic color only
- **No animations on data** — motion is for transitions and state changes, never
  for making numbers feel exciting
- **Accessible** — WCAG AA contrast minimum on all text. Every interactive
  element keyboard-navigable. Status communicated by color AND label (never
  color alone).
- **Mobile-aware** — tables collapse gracefully, forms stack to single column,
  stat cards wrap to 2-column grid on tablet

---

## What Good Looks Like

A new Atomberg employee opens Orbit on Day 1 of goal-setting season. Without
training, they understand: what they need to fill in, how weightage works, what
happens after they submit, and who reviews it. The UI makes the process
self-evident. That is the bar.
