# NutriPlan — Design System

Tokens and component specs for a fresh, appetizing, light-only visual language: cream, leaf green, citrus orange, real food photography.

| | |
|---|---|
| **Project** | NutriPlan |
| **Document** | Design System |
| **Status** | Approved |
| **Owner** | Ziad |
| **Date** | 2026-08-28 |

---

## 1. Color palette

NutriPlan ships a single light theme (no toggle — see DECISIONS.md D8). All tokens are defined once in Tailwind v4 `@theme` in `src/index.css`.

| Token | Hex | Usage |
|---|---|---|
| `cream-50` | `#FDFBF7` | Page background (`body`), navbar (92% + blur) |
| `white` | `#FFFFFF` | Card, modal, and input surfaces |
| `green-600` | `#16A34A` | Primary: buttons, active nav, selected chips, protein ring/donut segment, logo, focus ring, bar fill |
| `green-700` | `#15803D` | Primary hover/pressed; time-badge text |
| `green-100` | `#DCFCE7` | Tints: icon circles, time badges, success surfaces |
| `orange-500` | `#F97316` | Accent: carbs ring/donut segment, eyebrow highlights, active goal preset, slider thumb |
| `orange-600` | `#EA580C` | Accent hover; kcal-badge text |
| `orange-100` | `#FFEDD5` | Kcal badge background, accent tints |
| `amber-500` | `#EAB308` | Fat ring/donut segment only |
| `ink-900` | `#1C1917` | Headings, body text, wordmark |
| `stone-600` | `#57534E` | Secondary text: sublines, captions, meta, dimmed steps |
| `stone-200` | `#E7E5E4` | Borders, dividers, bar tracks, dashed slot outlines |
| `stone-100` | `#F5F5F4` | Input backgrounds, disabled fills, picker-row hover |
| `red-600` | `#DC2626` | Over-target bar fill + caption, validation errors, danger buttons |
| `red-50` | `#FEF2F2` | Error field tint |

**Rules.** Text on cream/white is `ink-900` or `stone-600` only (both ≥ 7:1 contrast). White text sits on `green-600`, `orange-500`, and `red-600` — never on tints. The macro trio (`green-600` / `orange-500` / `amber-500`) is reserved: never introduce a fourth data color. Focus ring everywhere: 2px `green-600`, 2px offset from the element.

## 2. Typography

Google Fonts, loaded with `display=swap`:

- **Bricolage Grotesque** — display: headings, wordmark, stat/number values. Weights 600, 700, 800.
- **Figtree** — body: everything else. Weights 400, 500, 600.

| Token | Family | Size / line-height | Weight | Usage |
|---|---|---|---|---|
| `display-xl` | Bricolage Grotesque | 44 / 48 px (mobile 34 / 38) | 800 | Home hero H1 |
| `display-lg` | Bricolage Grotesque | 36 / 40 px (mobile 30 / 36) | 700 | Page H1s |
| `heading-md` | Bricolage Grotesque | 28 / 34 px | 700 | Section H2s |
| `heading-sm` | Bricolage Grotesque | 22 / 28 px | 600 | Card titles, H3s, modal titles |
| `stat` | Bricolage Grotesque | 32 / 36 px | 700 | BMR/TDEE/target values, donut kcal, day names |
| `body-lg` | Figtree | 18 / 28 px | 400 | Sublines, hero sub, recipe description |
| `body-md` | Figtree | 16 / 26 px | 400 | Default body, ingredients, steps, inputs |
| `body-sm` | Figtree | 14 / 20 px | 500 | Badges, meta, bar labels, picker rows |
| `caption` | Figtree | 12 / 16 px, letter-spacing 0.08em, uppercase | 600 | Eyebrows, slot labels ("BREAKFAST"), field labels |

Numerals in stats and badges use `font-variant-numeric: tabular-nums` so animated counts don't jitter.

## 3. Spacing, radius, shadows

**Spacing scale (px):** 4, 8, 12, 16, 24, 32, 48, 64, 96. Section vertical rhythm: 64 mobile / 96 desktop. Card padding: 16 mobile / 24 desktop. Content max-width 1152px; gutters 16 / 24 / 32 at 375 / 768 / 1024.

| Radius token | Value | Applies to |
|---|---|---|
| `radius-md` | 8 px | Inputs, select, picker rows, small thumbnails |
| `radius-xl` | 12 px | Cards, images, planner slots, day columns, badge-tinted panels |
| `radius-2xl` | 16 px | Modal panel, hero image, nutrition panel |
| `radius-full` | 9999 px | Buttons, chips, badges, stepper buttons, bar tracks |

| Shadow token | Value | Applies to |
|---|---|---|
| `shadow-card` | `0 1px 2px rgb(28 25 23 / 0.06), 0 2px 8px rgb(28 25 23 / 0.05)` | Resting cards, navbar bottom edge |
| `shadow-lift` | `0 8px 24px rgb(28 25 23 / 0.10)` | Hovered cards, sticky results panel |
| `shadow-modal` | `0 24px 48px rgb(28 25 23 / 0.18)` | Modal panel, mobile menu sheet |

## 4. Motion tokens

| Token | Value | Used for |
|---|---|---|
| `duration-tap` | 150 ms | Tap scale, amount crossfade, reduced-motion fallback fades |
| `duration-ui` | 250 ms | Hover lift, chip color, exits, backdrop fade |
| `duration-panel` | 400 ms | Entrance fade-ups, calorie-bar width |
| `duration-count` | 700 ms | Number count-ups |
| `duration-ring` | 900 ms | Donut and ring stroke fills |
| `ease-standard` | `cubic-bezier(0.22, 1, 0.36, 1)` | All tweened motion |
| `spring-layout` | spring, stiffness 350, damping 32 | Layout reflow, modal/menu panels, planned-card entrances |
| `stagger-items` | 60 ms | Cards, menu items, clear-day exits |
| `stagger-hero` | 90 ms | Hero copy sequence |
| `lift-distance` | −4 px | Card hover translate |
| `tap-scale` | 0.95 (0.9 stepper) | Pressed chips/buttons |

Reduced motion (`prefers-reduced-motion: reduce`): every token collapses to instant render or a 150ms opacity fade; see PRD §8.2.

## 5. Component specs

### Buttons (`Button`)

All: `radius-full`, Figtree 600, `duration-ui` transitions, 44px min touch height, focus ring per §1.

| Variant | Resting | Hover | Notes |
|---|---|---|---|
| `primary` | `green-600` fill, white text | `green-700` | Main CTAs: "Start planning", "Calculate", "Save as planner target" |
| `secondary` | white fill, 1.5px `green-600` border, `green-700` text | `green-100` fill | "Browse recipes" |
| `ghost` | transparent, `stone-600` text | `stone-100` fill, `ink-900` text | "Clear filters", "Clear day", "Recalculate →" |
| `danger` | transparent, `red-600` text | `red-50` fill | Destructive confirms only |

Sizes: `md` 44px height, 24px x-padding, 16px text; `sm` 36px height, 16px x-padding, 14px text. Disabled: 45% opacity, no hover, `cursor-not-allowed`.

### Cards (`RecipeCard`, HowItWorks cards, result cards)

White surface, `radius-xl`, `shadow-card`, 1px `stone-200` border. Hover (linked cards only): `lift-distance` + `shadow-lift` + image scale 1.03. Image bleeds to top edges (rounded top corners), 4:3.

### Chips (`FilterChip`, `GoalPresets`, diet micro-chips)

`radius-full`, `body-sm`, 36px height (micro-chips 24px, caption size). Unselected: white fill, 1px `stone-200` border, `ink-900` text. Selected: `green-600` fill, white text, no border (goal presets select in `orange-500`). Tap: `tap-scale`.

### Badges (`Badge`)

`radius-full`, `body-sm` 600, 4px/12px padding, optional 14px lucide icon. Tones: `orange` (`orange-100` bg / `orange-600` text — kcal), `green` (`green-100` / `green-700` — time), `neutral` (`stone-100` / `stone-600` — servings, cuisine).

### Inputs, select, sliders

Inputs/select: white fill, 1px `stone-200` border, `radius-md`, 44px height, 14px x-padding, `body-md`; placeholder `stone-600` at 70%. Focus: border `green-600` + focus ring. Error: border `red-600`, `red-50` fill, `body-sm` `red-600` message below. Labels: `caption` style above the field. Range sliders: 6px `stone-200` track, `green-600` filled portion, 20px white thumb with 2px `orange-500` border.

### Nav

Sticky, 64px tall, `cream-50` at 92% + `backdrop-blur`, 1px `stone-200` bottom border. Links `body-md` 500 `ink-900`; active `green-600` + 2px underline bar; hover `green-600`. Mobile sheet: white, `shadow-modal`, `radius-xl` bottom corners.

### Planner pieces

Day columns: white cards, `radius-xl`, `shadow-card`. Slot label in `caption` style. Empty slot: 1.5px dashed `stone-200` border, `radius-xl`, `stone-600` "+ Add meal", hover border `green-600` + text `green-700`. Calorie bar: 8px track `stone-200`, fill `green-600` (over target: `red-600`), `radius-full`.

### Modal

Backdrop `rgb(28 25 23 / 0.45)`. Panel: white, `radius-2xl`, `shadow-modal`, max-width 560px, 24px padding; full-width bottom-sheet style under 768px (rounded top corners only).

## 6. Imagery and art direction

- **Style:** real food photography — overhead or 45° angle, natural daylight, warm tone. Dishes plated on neutral ceramics over light wood or stone that harmonizes with `cream-50`. Visible fresh ingredients (herbs, citrus, greens) preferred; appetizing, not sterile.
- **Consistency:** avoid dark-moody shots, heavy filters, hands/people as subjects, and busy restaurant scenes. Every photo should look like it belongs to one cookbook.
- **Sourcing:** free stock from Unsplash or Pexels, downloaded and committed to `src/assets/` — never hotlinked. Recipe photos: 1200×900 (4:3) WebP ≤ 180 KB, filename = recipe id (`grilled-lemon-chicken-bowl.webp`). Home hero: 1600×1200 WebP ≤ 220 KB (`home-hero.webp`).
- **Treatment:** `radius-xl` corners everywhere; no overlays or gradients on photos except the card hover scale.

## 7. Do / Do not

**Do**

- Use `green-600` for exactly one primary action per view.
- Keep kcal in orange badges and time in green badges — everywhere, always.
- Reserve Bricolage Grotesque for headings and stat numbers; Figtree for everything else.
- Round interactive things full; round surfaces `radius-xl`.
- Let the cream background breathe — white cards on cream, generous 24–32px gaps.

**Do not**

- Do not introduce new colors, gradients, or a dark palette.
- Do not put white text on tint colors (`green-100`, `orange-100`, `stone-100`).
- Do not use drop shadows heavier than `shadow-modal` or animate longer than `duration-ring`.
- Do not mix photo styles (no illustrations, no AI-look renders, no dark-moody food shots).
- Do not use color as the only status signal — pair it with text or an icon.
