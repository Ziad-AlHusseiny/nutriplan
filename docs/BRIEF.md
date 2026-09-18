# NutriPlan — Product Brief

Plan a week of healthy eating in minutes.

| | |
|---|---|
| **Project** | NutriPlan |
| **Document** | Product Brief |
| **Status** | Approved |
| **Owner** | Ziad |
| **Date** | 2026-08-28 |

---

## One-liner

NutriPlan is a recipe browser, weekly meal board, and calorie calculator in one — pick from 30 macro-labeled recipes, fill Monday through Sunday, and watch every day measure itself against your target.

## Elevator pitch

Most people don't fail at healthy eating because they lack recipes — they fail because Sunday night planning means five open tabs, a calculator app, and a guess. NutriPlan collapses that ritual into one screen. Every recipe in the collection carries honest numbers: calories, protein, carbs, fat, prep time. Filter down to what fits your diet and your evening, drop meals into a weekly board, and each day totals itself against a calorie target you set with the built-in BMR/TDEE calculator. No account, no subscription, no syncing anxiety — your plan lives in your browser and is ready when you open the tab. NutriPlan is the fastest path from "I should eat better this week" to a finished plan you'll actually follow.

## Target users (of the fictional product)

| User | Situation | What NutriPlan gives them |
|---|---|---|
| The Sunday planner | Preps meals for the work week, tired of spreadsheet math | A visual board with automatic per-day calorie totals |
| The macro tracker | Lifts 4x/week, eats to a protein and calorie goal | High-protein filtering, full macros per serving, TDEE-derived target |
| The diet-restricted cook | Vegan, vegetarian, or keto; most recipe sites waste their time | Diet chips that cut the collection to only what they can eat |
| The beginner | Knows they should "count calories" but not where to start | A calculator that explains BMR/TDEE and turns it into one daily number |

## Portfolio goals — skills this project demonstrates

1. **Multi-page SPA architecture** with react-router-dom v7: nested layout route, dynamic `/recipes/:id` params, deep-linkable pages on a static host.
2. **Complex derived state**: compound filtering (search + cuisine + diet + two range caps), ingredient rescaling from a servings stepper, per-day calorie aggregation against a target.
3. **Hand-rolled SVG data visualization**: macro donut and progress rings built with stroke-dash math — no chart library.
4. **localStorage persistence** done properly: namespaced keys, lazy initialization, corrupt-data recovery.
5. **Framer Motion depth**: layout animations on planner add/remove, `AnimatePresence` exits, mount-animated rings, spring-driven number count-ups — all gated behind `prefers-reduced-motion`.
6. **Design-system discipline**: tokenized color/type/spacing/motion in Tailwind v4 `@theme`, applied consistently across five pages.
7. **Responsive product thinking**: a 7-column weekly board that degrades gracefully to a stacked mobile layout from 375px up.
8. **Accessible interactive patterns**: focus-trapped modal, `aria-pressed` filter chips, keyboard-operable steppers and checklists, labeled SVG graphics.

## Scope

### In scope

- Five routes: `/` (Home), `/recipes`, `/recipes/:id`, `/planner`, `/calculator` (+ a `*` catch-all that redirects unknown paths to `/`).
- 30 hand-authored mock recipes with full macros, cuisine, diet tags, prep time, servings, ingredients, and steps in `src/data/recipes.js`.
- Recipe search + filters: cuisine chips, diet chips (vegan, vegetarian, high-protein, keto), max-calories slider, max-time slider.
- Recipe detail: servings stepper that rescales ingredient amounts, numbered steps checklist, SVG macro donut and progress rings.
- Weekly planner board (Monday–Sunday × breakfast/lunch/dinner), recipe picker modal, per-day calorie totals vs. target, clear-day action, persistence to `localStorage` key `nutriplan-plan`.
- BMR/TDEE calculator (Mifflin-St Jeor) with animated results, goal presets, and "save target to planner" writing `nutriplan-target`.
- Fully responsive 375px+, keyboard accessible, reduced-motion compliant, deployed as a static site on Vercel.

### Explicitly out of scope

- Backend, database, accounts, or real auth of any kind.
- Drag-and-drop between planner slots (adding is picker-modal only).
- Shopping-list generation, recipe authoring/editing, favorites, or ratings.
- Imperial units in the calculator (metric cm/kg only).
- Dark mode / theme toggle — NutriPlan ships one light, food-forward theme.
- Micronutrients beyond kcal/protein/carbs/fat.

## Measurable success criteria

| # | Criterion | Target |
|---|---|---|
| 1 | Lighthouse (mobile, production URL) | Performance ≥ 95, Accessibility = 100, Best Practices = 100 |
| 2 | Largest Contentful Paint on `/` (emulated mobile) | ≤ 2.5 s |
| 3 | Cumulative Layout Shift, all routes | < 0.05 |
| 4 | Initial JS bundle (gzipped, excluding lazy route chunks) | ≤ 180 KB |
| 5 | Filter correctness | Every combination of search, chips, and sliders returns exactly the matching subset of the 30 recipes |
| 6 | Persistence | A planned week and a saved calorie target survive a full reload and browser restart |
| 7 | Responsiveness | Zero horizontal page scroll at 375, 768, and 1024 px; planner board usable at all three |
| 8 | Keyboard access | Every interactive flow (filtering, stepper, checklist, planner add/remove/clear, calculator) completable without a mouse |
| 9 | Reduced motion | With `prefers-reduced-motion: reduce`, no decorative animation plays; rings and numbers render at final values |
