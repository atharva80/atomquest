# DESIGN.md — Orbit by Atomberg

> Google Stitch format. Read by Impeccable before every command.
> Last updated: May 2026

---

## 1. Colors

### Philosophy
Orbit uses a near-monochromatic zinc system. Color is a signal, not a decoration.
The base surface is white with zinc grays for hierarchy. Status colors exist
solely for at-a-glance legibility — they are desaturated and never used as fills.
There is no primary brand color. Zinc-900 (near-black) is the primary action color.

### Base Palette (Tailwind zinc)

| Token | Value | Usage |
|---|---|---|
| `zinc-950` | `#09090b` | Text primary (headings, labels, values) |
| `zinc-700` | `#3f3f46` | Text secondary (descriptions, metadata) |
| `zinc-500` | `#71717a` | Text tertiary / muted / placeholders |
| `zinc-400` | `#a1a1aa` | Disabled text, hint text |
| `zinc-200` | `#e4e4e7` | Border default |
| `zinc-100` | `#f4f4f5` | Background secondary (sidebar, table header) |
| `zinc-50`  | `#fafafa` | Background tertiary (page bg) |
| `white`    | `#ffffff` | Background primary (cards, panels) |

### Primary Action
- Button background: `zinc-900`
- Button text: `white`
- Button hover: `zinc-700`
- Button active: `zinc-950`
- No colored primary buttons anywhere. One exception: destructive actions use
  `text-red-600` text-only buttons, never filled red.

### Status Colors (desaturated, text + dot only — never filled backgrounds)

Status is communicated with a colored dot + zinc badge background.
Never use filled emerald/amber/red backgrounds.

```
On track    → dot: #16a34a (green-600)   badge bg: zinc-100  text: zinc-700
At risk     → dot: #ca8a04 (yellow-600)  badge bg: zinc-100  text: zinc-700
Not started → dot: zinc-300              badge bg: zinc-100  text: zinc-500
Completed   → dot: zinc-900              badge bg: zinc-100  text: zinc-700
Overdue     → dot: #dc2626 (red-600)     badge bg: zinc-100  text: zinc-700
```

Badge anatomy: `[dot 6px] [label]` — `text-xs font-medium px-2 py-0.5 rounded-md`
The dot is the only colored element. Background and text stay zinc.

### Chart Colors (analytics only)
When charts require multiple series, use zinc ramp with one accent:
- Series 1: `zinc-900`
- Series 2: `zinc-500`
- Series 3: `zinc-300`
- Accent series: `zinc-700`
No rainbow palettes. No vivid multi-color chart lines.

### What is never allowed
- Blue in any component (borders, icons, buttons, highlights)
- Filled colored badges (emerald-50 bg, amber-50 bg, etc.)
- Gradient of any kind
- Opacity-layered colored backgrounds
- Icon containers with colored backgrounds

---

## 2. Typography

### Font Stack
```css
font-family: 'Inter', 'Inter Variable', system-ui, -apple-system, sans-serif;
```
Inter only. No serif. No display font. No mixed pairing.

### Scale

| Role | Class | Weight | Size |
|---|---|---|---|
| Page title | `text-2xl font-semibold tracking-tight text-zinc-950` | 600 | 24px |
| Section heading | `text-base font-medium text-zinc-950` | 500 | 16px |
| Section label | `text-xs font-medium text-zinc-500 uppercase tracking-widest` | 500 | 12px |
| Body | `text-sm text-zinc-700 leading-relaxed` | 400 | 14px |
| Table cell primary | `text-sm font-medium text-zinc-900` | 500 | 14px |
| Table cell secondary | `text-sm text-zinc-500` | 400 | 14px |
| Data value (large) | `text-2xl font-semibold tabular-nums text-zinc-950` | 600 | 24px |
| Caption / hint | `text-xs text-zinc-400` | 400 | 12px |
| Badge label | `text-xs font-medium text-zinc-700` | 500 | 12px |

### Rules
- `tabular-nums` on every number that appears in a table, stat card, or metric
- No italic anywhere in the product UI
- No font-weight above 600 — never 700, never 800
- No text smaller than 12px
- Line height: `leading-5` (20px) for dense UI, `leading-relaxed` for prose
- Sentence case everywhere — never ALL CAPS except section labels
- Section labels use `tracking-widest` not `tracking-wide`

---

## 3. Spacing & Elevation

### Spacing Scale
Follow Tailwind's default 4px base. Standard increments in use:

| Usage | Value |
|---|---|
| Inside component padding | `p-4` (16px) |
| Card padding | `p-5` (20px) |
| Section gap | `gap-6` (24px) |
| Page content padding | `px-6 py-6` |
| Inline gap (icon + label) | `gap-2` (8px) |
| Form field gap | `gap-1.5` (6px) |
| Table cell padding | `px-4 py-3` |

### Border Radius
| Component | Value |
|---|---|
| Cards, panels | `rounded-xl` (12px) |
| Buttons, inputs, badges | `rounded-md` (6px) |
| Stat cards | `rounded-xl` |
| Dropdown, popover | `rounded-lg` (8px) |
| Avatars | `rounded-full` |

No `rounded-2xl` or larger anywhere. No pill buttons (no `rounded-full` on buttons).

### Elevation (shadows)
Orbit is flat. Elevation is communicated through border and background color, not shadow.

| Surface | Treatment |
|---|---|
| Card | `bg-white border border-zinc-200 rounded-xl` |
| Sidebar | `bg-zinc-50 border-r border-zinc-200` |
| Dropdown / popover | `bg-white border border-zinc-200 shadow-sm rounded-lg` |
| Modal | `bg-white border border-zinc-200 shadow-md rounded-xl` |
| Toast | `bg-zinc-950 text-white rounded-lg` |

`shadow-sm` is the maximum shadow used in the product. Never `shadow-lg`, never `shadow-xl`.
Toasts are dark (zinc-950 bg, white text) — not colored per notification type.

### Layout
- Sidebar: fixed, 240px wide, `bg-zinc-50 border-r border-zinc-200`
- Top bar: 56px tall, `bg-white border-b border-zinc-200` — breadcrumb left, avatar right
- Content area: `flex-1 overflow-auto bg-zinc-50`
- Page content wrapper: `max-w-6xl mx-auto px-6 py-6`
- Stat card grid: `grid grid-cols-4 gap-4` (desktop), collapses to 2 on tablet

---

## 4. Components

### Buttons

```
Primary:     bg-zinc-900 text-white hover:bg-zinc-700 rounded-md px-4 py-2 text-sm font-medium
Secondary:   bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50 rounded-md px-4 py-2 text-sm
Ghost:       bg-transparent text-zinc-600 hover:bg-zinc-100 rounded-md px-3 py-1.5 text-sm
Destructive: bg-white text-red-600 border border-zinc-200 hover:bg-red-50 rounded-md px-4 py-2 text-sm
Disabled:    opacity-40 cursor-not-allowed (any variant)
```

No icon squares inside buttons. Icon + label: `gap-2`, icon at `h-4 w-4`.

### Icons
- Library: Lucide React (outline only)
- Color: `text-zinc-400` for decorative/nav icons
- Color: `text-zinc-600` for interactive icons (action buttons)
- Color: `text-zinc-950` for primary emphasis icons
- Size: `h-4 w-4` inline, `h-5 w-5` standalone actions, `h-8 w-8` empty states
- **No colored icon containers. No tinted rounded squares behind icons.**
- Icons in sidebar nav: same `text-zinc-400`, active state `text-zinc-950`

### Stat Cards

```
bg-white border border-zinc-200 rounded-xl p-5

Structure:
  Row 1: [muted label text-xs text-zinc-500 uppercase tracking-widest]
  Row 2: [large value text-2xl font-semibold tabular-nums text-zinc-950]
  Row 3: [delta — text-xs text-zinc-500] with colored dot for direction:
           up: green-600 dot   down: red-600 dot   flat: zinc-300 dot
```

No icon squares. No colored card accents. No left border color strips.
Four cards in a row. Identical visual weight — no "featured" card.

### Status Badges

```
Base:  bg-zinc-100 rounded-md px-2 py-0.5 inline-flex items-center gap-1.5

Dot:   w-1.5 h-1.5 rounded-full flex-shrink-0
       on_track    → bg-green-600
       at_risk     → bg-yellow-500
       not_started → bg-zinc-300
       completed   → bg-zinc-900
       overdue     → bg-red-600

Label: text-xs font-medium text-zinc-700
```

Never change the badge background by status. Always zinc-100. Only the dot changes.

### Progress Bars

```
Container: h-1.5 bg-zinc-100 rounded-full overflow-hidden w-full
Fill:      h-full rounded-full transition-none

Fill color by score:
  ≥ 80%  → bg-green-600
  50–79% → bg-yellow-500
  < 50%  → bg-red-500
  0%     → bg-zinc-200 (not started)
```

Always paired with tabular-nums label: `text-sm font-medium tabular-nums text-zinc-700`
placed to the right of the bar. Never animate the fill.
Height is always `h-1.5` — never thicker.

### Data Tables

```
Wrapper:     overflow-hidden rounded-xl border border-zinc-200 bg-white
Header row:  bg-zinc-50 border-b border-zinc-200
             th: px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-widest text-left
Body row:    border-b border-zinc-100 hover:bg-zinc-50/60 transition-colors
             td: px-4 py-3
Primary cell (name, title): text-sm font-medium text-zinc-900
Secondary cell (date, ID):  text-sm text-zinc-500
Numeric cell:               text-sm tabular-nums text-zinc-700 text-right
```

Sticky header on scroll. No alternating row colors (zebra striping).
Row hover is the only visual feedback — no row selection highlight unless
selection is a feature.

### Forms

```
Label:       text-sm font-medium text-zinc-700 mb-1.5
Input:       bg-white border border-zinc-200 rounded-md px-3 py-2 text-sm
             focus: ring-2 ring-zinc-950/10 border-zinc-400 outline-none
             placeholder: text-zinc-400
Error state: border-red-400 ring-2 ring-red-500/10
Error text:  text-xs text-red-600 mt-1 (below the field — never toast)
Helper text: text-xs text-zinc-400 mt-1
```

shadcn Form + react-hook-form + Zod. No raw `<input>` elements.
Inline validation only. Never show a validation toast for a form field.

### Weightage Ring (goal creation)
The live weightage indicator during goal creation:

```
Position: fixed to the right of the form or top of the goals list
Shape:    circular progress ring (SVG), 80px diameter
Stroke:   zinc-200 background, zinc-900 fill (arc matching % used)
Center:   remaining % in text-lg font-semibold tabular-nums text-zinc-950
Label:    "remaining" in text-xs text-zinc-500 below the number

State changes:
  < 100% remaining: ring fill zinc-900
  = 100% remaining: ring fill zinc-900 (complete, valid)
  > 100% used:      ring fill red-600, text red-600 (over limit — invalid)
```

No animation on the ring — it updates immediately on input change.

### Empty States

Every empty state follows this exact structure:

```
Container: flex flex-col items-center justify-center py-16 text-center
Icon:      h-8 w-8 text-zinc-300 mb-4 (Lucide, always zinc-300)
Heading:   text-sm font-medium text-zinc-900 mb-1
Body:      text-sm text-zinc-500 mb-4 max-w-xs
CTA:       Primary or Secondary button (contextual)
```

Never a blank white area. Never a spinner as an empty state.
Icon is always zinc-300 — not colored, not tinted.

### Skeleton Loaders

Match the shape of real content exactly.

```
Base class: animate-pulse bg-zinc-100 rounded

Stat card skeleton:   h-4 w-20 mb-3 (label) + h-8 w-32 (value)
Table row skeleton:   h-4 per cell, matching column widths
Card skeleton:        full card dimensions
Text line skeleton:   h-3 w-3/4, h-3 w-1/2 (staggered widths look natural)
```

Never use a spinner. Always use a skeleton that matches the shape of the real content.

### Sidebar Navigation

```
Width:     240px fixed
Bg:        bg-zinc-50 border-r border-zinc-200

Section label:  text-xs font-medium text-zinc-400 uppercase tracking-widest
                px-3 mb-1 mt-4

Nav item:       flex items-center gap-2 px-3 py-1.5 rounded-md
                text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900
                Icon: h-4 w-4 text-zinc-400

Active state:   bg-zinc-100 text-zinc-950 font-medium
                Icon: text-zinc-700
                No left border accent strip. No colored highlight.
```

### Toasts / Notifications

```
All toasts: bg-zinc-950 text-white text-sm rounded-lg px-4 py-3
            No color coding by type — type is communicated by the message text
            and a subtle icon (check for success, x for error — both white)
Duration:   3s success, 5s error
Position:   bottom-right
```

No green success toasts. No red error toasts. Monochromatic always.

---

## 5. Do's

- Use `tabular-nums` on every number that appears in a table, metric, or score
- Use `tracking-widest` on all section labels (uppercase 12px labels)
- Use `zinc-100` as the badge background for every status type
- Use the dot-only pattern for status — colored dot, zinc label
- Use `h-1.5` for all progress bars — never thicker
- Use `bg-zinc-950` for all primary action buttons
- Use `shadow-sm` maximum — only on dropdowns and modals
- Use `rounded-xl` for cards, `rounded-md` for buttons and inputs
- Use skeleton loaders that match the real content shape
- Add an empty state (icon + heading + description + CTA) to every list view
- Confirm destructive actions with a modal — never a single click
- Validate inline — errors appear below the field, never as a toast

---

## 6. Don'ts

- **Never** use blue anywhere in the product (border, button, icon, highlight)
- **Never** put a colored background behind an icon
- **Never** use filled colored badges (emerald-50, amber-50, red-50 backgrounds)
- **Never** animate numbers counting up or progress bars filling in on load
- **Never** use font-weight 700 or 800
- **Never** use a spinner as a loading state
- **Never** show a blank white box as an empty state
- **Never** use gradients of any kind
- **Never** use `shadow-lg` or larger
- **Never** use `rounded-full` on buttons (pill shape)
- **Never** use rainbow or vivid multi-color chart palettes
- **Never** use colored toasts (green for success, red for error)
- **Never** use italic text in the product UI
- **Never** add a left border color strip to cards to indicate status
- **Never** animate anything on data load — motion is for transitions only
- **Never** use text smaller than 12px