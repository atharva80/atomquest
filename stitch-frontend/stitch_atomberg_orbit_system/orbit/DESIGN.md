---
name: Orbit
colors:
  surface: '#fbf8ff'
  surface-dim: '#dad9e3'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f2fd'
  surface-container: '#eeedf7'
  surface-container-high: '#e8e7f1'
  surface-container-highest: '#e3e1ec'
  on-surface: '#1a1b22'
  on-surface-variant: '#47464a'
  inverse-surface: '#2f3038'
  inverse-on-surface: '#f1effa'
  outline: '#78767b'
  outline-variant: '#c8c5ca'
  surface-tint: '#5f5e60'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1d'
  on-primary-container: '#858386'
  inverse-primary: '#c8c6c8'
  secondary: '#5e5e65'
  on-secondary: '#ffffff'
  secondary-container: '#e3e1ea'
  on-secondary-container: '#64646b'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1f1a1a'
  on-tertiary-container: '#8a8282'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e1e4'
  primary-fixed-dim: '#c8c6c8'
  on-primary-fixed: '#1c1b1d'
  on-primary-fixed-variant: '#474649'
  secondary-fixed: '#e3e1ea'
  secondary-fixed-dim: '#c7c5ce'
  on-secondary-fixed: '#1b1b21'
  on-secondary-fixed-variant: '#46464d'
  tertiary-fixed: '#ebe0df'
  tertiary-fixed-dim: '#cec4c4'
  on-tertiary-fixed: '#1f1a1a'
  on-tertiary-fixed-variant: '#4c4545'
  background: '#fbf8ff'
  on-background: '#1a1b22'
  surface-variant: '#e3e1ec'
  zinc-950: '#09090b'
  zinc-900: '#18181b'
  zinc-700: '#3f3f46'
  zinc-500: '#71717a'
  zinc-400: '#a1a1aa'
  zinc-200: '#e4e4e7'
  zinc-100: '#f4f4f5'
  zinc-50: '#fafafa'
  white: '#ffffff'
  status-on-track: '#16a34a'
  status-at-risk: '#ca8a04'
  status-overdue: '#dc2626'
  status-not-started: '#d4d4d8'
  progress-low: '#ef4444'
  progress-mid: '#eab308'
  progress-high: '#16a34a'
typography:
  page-title:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  section-heading:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  section-label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.1em
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-relaxed:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 24px
  table-cell-primary:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  data-value-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  badge-label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  field-gap: 0.375rem
  inline-gap: 0.5rem
  component-padding: 1rem
  card-padding: 1.25rem
  section-gap: 1.5rem
  page-margin: 1.5rem
  sidebar-width: 240px
  header-height: 56px
---

## Brand & Style

The design system embodies "Subtle High-Tech"—a philosophy where precision is the primary aesthetic. It is engineered for professional efficiency, drawing inspiration from scientific instrumentation and high-performance dashboards. The brand personality is technical, focused, and intentionally restrained, prioritizing clarity and information density over decorative flair.

### Design Style: Minimalism & Precision
This is a "Hard Minimalist" system built on a monochromatic Zinc foundation. It rejects traditional UI embellishments like gradients, vibrant fills, and soft shadows in favor of:
- **Hairline Precision:** Using 0.5px and 1px borders to create a "Retina-sharp" look.
- **Chromatophobia:** Color is treated as a functional signal (data status) rather than a brand element. Blue is strictly prohibited.
- **Flat Elevation:** Depth is achieved through tonal layering and hair-thin outlines rather than shadows.
- **Atmosphere:** Scientific, reliable, and modern. It feels like a high-end physical hardware interface translated to a digital screen.

## Colors

The palette is strictly monochromatic, utilizing the Zinc scale to define hierarchy. Color is reserved exclusively for status signaling and data visualization.

### Functional Rules
- **Primary Action:** `zinc-900` is the exclusive color for primary interactive elements.
- **Status Signaling:** Communicated via the "Dot + Zinc" pattern. Status indicators use a 6px colored dot paired with a `zinc-100` background and `zinc-700` text. 
- **Forbidden:** No blue is permitted in any UI element. No filled colored backgrounds (e.g., emerald-50) for badges.
- **Progress Bars:** Fills are color-coded by score (Red < 50%, Yellow 50–79%, Green ≥ 80%) but maintain a constant `h-1.5` height.
- **Charts:** Use a Zinc ramp (`zinc-900` to `zinc-300`) with `zinc-700` as the single accent series.

## Typography

This design system uses **Inter** exclusively. It relies on weight and tracking rather than font pairings to establish hierarchy.

### Typography Rules
- **Numerical Precision:** `tabular-nums` must be enabled for all metrics, table data, and progress scores to ensure vertical alignment.
- **Weight Limit:** Maximum font weight is `600` (Semi-bold). Never use `700` or higher.
- **Case & Tracking:** Use sentence case for almost all UI. The only exception is **Section Labels**, which must be uppercase with `widest` tracking (0.1em).
- **Legibility:** No text smaller than 12px. No italics are permitted anywhere in the UI.

## Layout & Spacing

The system uses a strict 4px grid (Tailwind base). The layout is designed for high information density without sacrificing clarity.

### Layout Structure
- **Sidebar:** Fixed 240px width, `zinc-50` background with a `zinc-200` right border.
- **Top Bar:** 56px height, `white` background with a `zinc-200` bottom border.
- **Grid Strategy:** A fluid `auto-fit` grid for cards with a minimum width of 280px.
- **Stat Cards:** On desktop, these must follow a 4-column layout, collapsing to 2 columns on tablet.

### Spacing Philosophy
Consistent vertical rhythm is maintained through standard gaps (`gap-6` for sections, `gap-1.5` for form fields). Alignment should always prioritize the left edge, except for numeric table cells which are right-aligned.

## Elevation & Depth

Orbit is a flat system. Depth is communicated through structural borders and subtle background shifts rather than light-source metaphors.

### Depth Strategies
- **Tonal Layering:** The primary page background is `zinc-50`. Surfaces (cards, panels) sit on top in `white`. This 1-step tonal shift creates hierarchy without shadows.
- **High-Definition Outlines:** Cards use a `zinc-200` border at `1px` (or `0.5px` for specific technical density).
- **Shadow Limitation:** `shadow-sm` is the absolute maximum elevation permitted, used only for floating elements like dropdowns or popovers to provide a slight lift from the surface.
- **Selection:** Active or selected states are indicated by increasing border width (e.g., from 0.5px to 2px) or a background shift to `zinc-100`, never through an increase in shadow.

## Shapes

The shape language is controlled and systematic, using varying radii to distinguish between containers and interactive elements.

- **Containers (Cards, Modals, Stat Cards):** Use `rounded-xl` (12px) to define major content areas.
- **Interactive Elements (Buttons, Inputs, Badges):** Use `rounded-md` (6px) for a tighter, more functional appearance.
- **Popovers/Dropdowns:** Use `rounded-lg` (8px).
- **Avatars:** The only exception to the rectangular rule, using `rounded-full`.
- **Constraint:** Never use "pill" shapes for buttons. All buttons must have defined corners (6px).

## Components

### Buttons
- **Primary:** `zinc-900` fill, white text. No colored primary buttons.
- **Secondary:** White fill, `zinc-200` border, `zinc-700` text.
- **Destructive:** Text-only or bordered with `red-600` text; never filled red.

### Status Badges
Badges are non-negotiable in structure: `[6px Dot] [Label]`. The background is always `zinc-100` and the text is `zinc-700`. Only the dot color changes to indicate status (Green, Yellow, Red, or Zinc).

### Progress Bars
- **Height:** Fixed at `h-1.5` (6px).
- **Color Logic:** Score-based fills (Red/Yellow/Green).
- **Labeling:** Always paired with a right-aligned `tabular-nums` percentage label.

### Stat Cards
Stat cards must contain three rows:
1. Muted uppercase label (`tracking-widest`).
2. Large `tabular-nums` value.
3. Delta indicator (text + colored directional dot).

### Empty States & Skeletons
- **Empty States:** Must include a `zinc-300` Lucide icon, centered heading, description, and CTA. Never leave a screen blank.
- **Skeletons:** Must mimic the exact layout of the content (e.g., specific widths for text lines) using `bg-zinc-100` with an `animate-pulse` effect. No spinners.

### Toasts
Toasts are dark and monochromatic: `bg-zinc-950`, white text. Success or Error is communicated via text and a simple white icon, never by changing the toast background color.