# NutriPlan — Product Requirements Document

Every page, section, copy string, interaction, and acceptance criterion for the NutriPlan build.

| | |
|---|---|
| **Project** | NutriPlan |
| **Document** | PRD |
| **Status** | Approved |
| **Owner** | Ziad |
| **Date** | 2026-08-28 |

---

## 1. Route map

| Route | Page | Purpose |
|---|---|---|
| `/` | HomePage | Compact hero, how-it-works, featured recipes |
| `/recipes` | RecipesPage | Search + filterable grid of all 30 recipes |
| `/recipes/:id` | RecipeDetailPage | Full recipe: hero, ingredients + servings stepper, steps checklist, macro visuals |
| `/planner` | PlannerPage | Weekly Monday–Sunday board with breakfast/lunch/dinner slots |
| `/calculator` | CalculatorPage | BMR/TDEE calculator with goal presets and target save |
| `*` | — | Any unknown path redirects to `/` |

All routes render inside `RootLayout` (Navbar + page outlet + Footer).

## 2. Global shell

### 2.1 Navbar

- Left: logo — lucide `Leaf` icon in leaf green + wordmark **"NutriPlan"** (Bricolage Grotesque 700). Links to `/`.
- Center/right links, in order: **Home**, **Recipes**, **Planner**, **Calculator**. Active link is leaf green with a 2px underline bar; inactive links are ink, hover leaf green.
- Far right (≥768px only): primary button **"Start planning"** → `/planner`.
- Sticky top, cream background at 92% opacity with `backdrop-blur`, 1px bottom border (stone-200).

**Mobile (< 768px):** links collapse behind a hamburger (lucide `Menu`). Tapping opens a full-width dropdown sheet under the bar listing the four links plus the **"Start planning"** button; icon swaps to `X`. Sheet closes on link tap, `Esc`, or outside click. Sheet animates height + fade (250ms); items stagger in 60ms apart.

- Given the mobile menu is open, When the user presses `Esc`, Then the menu closes and focus returns to the hamburger button.

### 2.2 Footer

- Line 1: logo + **"NutriPlan"**.
- Line 2: **"A front-end portfolio project by Ziad. Recipes, imagery, and nutrition data are for demonstration only — not dietary advice."**
- Link row: Home, Recipes, Planner, Calculator, **"Source on GitHub"** (external).
- Bottom line: **"© 2026 NutriPlan"**.

## 3. Home — `/`

Sections in order: Hero → HowItWorks → FeaturedRecipes.

### 3.1 Hero (compact)

- Eyebrow (caption style, leaf green): **"MEAL PLANNING, WITHOUT THE SPREADSHEET"**
- H1 (display-xl): **"Plan a week of healthy eating in minutes"**
- Subheadline (body-lg, stone-600): **"Thirty recipes with honest macros, a weekly board that does the math, and a calorie target that keeps score for you."**
- CTAs: primary button **"Start planning"** → `/planner`; secondary (outline) button **"Browse recipes"** → `/recipes`.
- Stat caption under CTAs: **"30 recipes · 6 cuisines · full macros on every card"**
- Right side: hero food photograph (`home-hero.webp`), rounded-xl, subtle shadow-card.
- Compact: hero block max height ~560px desktop; no full-viewport hero.

**Motion:** on mount, eyebrow → H1 → sub → CTAs → stat fade-up (12px) staggered 90ms, 400ms each, ease-standard. Image fades in with slight scale from 1.02 → 1. Skipped entirely under reduced motion (content renders in place).

**Responsive:** 375px — single column, image below copy, buttons full-width stacked. 768px — single column, image below, buttons inline. 1024px+ — two columns (copy 7/12, image 5/12), buttons inline.

### 3.2 HowItWorks

- H2: **"How it works"**
- Three cards (white, rounded-xl, shadow-card), each with a lucide icon in a green-100 circle:

| # | Icon | Card title | Card body |
|---|---|---|---|
| 1 | `Search` | **Find recipes you'll actually cook** | **"Filter by cuisine, diet, calories, and prep time — every recipe shows its full macros."** |
| 2 | `CalendarDays` | **Fill your week in a few taps** | **"Add breakfast, lunch, and dinner to any day. Totals update as you go."** |
| 3 | `Target` | **Hit your calorie target** | **"Set your number with the built-in TDEE calculator and watch every day measure up."** |

**Motion:** cards fade-up on scroll into view (whileInView, once), staggered 60ms.

**Responsive:** 375px — stacked. 768px — 3 columns (tight). 1024px+ — 3 columns with wider gaps.

### 3.3 FeaturedRecipes

- H2: **"Fresh this week"** with subline **"Three favorites from the collection."**
- Right-aligned link: **"See all 30 recipes →"** → `/recipes`.
- Three `RecipeCard`s (the three ids exported as `featuredRecipeIds` from `src/data/recipes.js`). Identical card behavior to the Recipes page (§4.3).

**Responsive:** 375px — stacked. 768px — 2 columns (third card spans under). 1024px+ — 3 columns.

### Home acceptance criteria

- Given a first visit to `/`, When the page loads, Then hero copy, three how-it-works cards, and exactly three featured recipe cards render with no layout shift from images (explicit dimensions).
- Given any featured card, When clicked or activated with `Enter`, Then the app navigates to that recipe's `/recipes/:id`.

## 4. Recipes — `/recipes`

Sections in order: page header → RecipeFilters → result count → RecipeGrid (or EmptyState).

### 4.1 Page header

- H1 (display-lg): **"Find your next meal"**
- Subline: **"Thirty recipes, honest macros. Filter until it fits your week."**

### 4.2 RecipeFilters

1. **Search input.** Placeholder: **"Search recipes or ingredients…"**. lucide `Search` icon left; clear button (`X`) appears when non-empty. Matches case-insensitively against recipe title and ingredient names. Debounced 200ms.
2. **Cuisine chips** — group label **"Cuisine"**: `Mediterranean`, `Italian`, `Asian`, `Mexican`, `Middle Eastern`, `American`. Multi-select; selected chips OR together.
3. **Diet chips** — group label **"Diet"**: `Vegan`, `Vegetarian`, `High-protein`, `Keto`. Multi-select; selected chips OR together.
4. **Max calories slider** (`RangeSlider`) — label **"Max calories"**. Range 200–800 kcal, step 50, default 800. Value readout right of label: **"650 kcal"**; at 800 it reads **"Any"**.
5. **Max time slider** (`RangeSlider`) — label **"Max time"**. Range 10–60 min, step 5, default 60. Readout **"30 min"**; at 60 it reads **"Any"**.
6. **"Clear filters"** ghost button — visible only when any filter differs from default; resets everything including search.

Filter logic: `matchesSearch AND matchesCuisine AND matchesDiet AND kcal ≤ maxCalories AND prepTime ≤ maxTime` (chip groups OR internally, AND across groups).

Result count line above the grid: **"18 recipes"** (singular **"1 recipe"**).

**Motion:** chips are `FilterChip` components — tap scale 0.95 (150ms), selected state fills leaf green with white text (250ms color transition). Grid re-orders with layout animation; leaving cards fade out 250ms.

**Responsive:** 375px — search full-width; chips wrap in horizontally scrollable rows; sliders stack full-width inside a collapsible **"Filters"** disclosure (collapsed by default, shows active-filter count badge, e.g. **"Filters · 3"**). 768px — filters always expanded; chips wrap; sliders side-by-side. 1024px+ — single filter bar: search left, chips center, sliders right.

### 4.3 RecipeCard (shared component)

- Photo (4:3, rounded-xl top), title (heading-sm), cuisine label (body-sm, stone-600).
- Badges: **"520 kcal"** (orange-100 bg, orange-600 text) and **"25 min"** (green-100 bg, green-700 text, lucide `Clock` icon).
- Diet tags as micro-chips when present (e.g. **"Vegan"**).
- Entire card is one link to `/recipes/:id`.

**Motion:** hover lifts card −4px with shadow-card → shadow-lift and image scale 1.03 (250ms, ease-standard). Focus-visible shows the standard green focus ring.

### 4.4 Empty state

`EmptyState` component when 0 results:

- Icon: lucide `SearchX`
- Title: **"No recipes match"**
- Body: **"Loosen the calorie cap or clear a chip or two — good food is close."**
- Button: **"Clear all filters"** (resets all filters and search).

### Recipes acceptance criteria

- Given default filters, When `/recipes` loads, Then all 30 cards render and the count reads **"30 recipes"**.
- Given the `Vegan` chip is selected, When the grid updates, Then only recipes whose `diets` include `"vegan"` appear.
- Given `Vegan` and `Keto` are both selected, When the grid updates, Then recipes matching either diet appear (OR within group).
- Given the `Asian` cuisine chip and the `Vegan` diet chip are selected, When the grid updates, Then only recipes that are both Asian AND vegan appear (AND across groups).
- Given max calories is set to 500, When the grid updates, Then no visible card shows a kcal badge above 500.
- Given the search reads "chicken", When results update, Then every visible recipe contains "chicken" in its title or ingredient names.
- Given filters that produce zero matches, When the grid empties, Then the empty state renders and **"Clear all filters"** restores all 30 recipes.
- Given any active filter, When **"Clear filters"** is clicked, Then all controls return to defaults in one action.
- Given keyboard focus on a chip, When `Space` or `Enter` is pressed, Then the chip toggles and `aria-pressed` reflects its state.

## 5. Recipe detail — `/recipes/:id`

Sections in order: back link → RecipeHero → IngredientsList (with ServingsStepper) → StepsChecklist → NutritionPanel.

### 5.1 Back link

**"← All recipes"** → `/recipes`.

### 5.2 RecipeHero

- Full-width photo (16:9 desktop, 4:3 mobile, rounded-xl).
- H1: recipe title. Body-lg description beneath.
- Badge row: **"520 kcal / serving"**, **"25 min"**, **"2 servings"**, cuisine (e.g. **"Mediterranean"**), plus diet tags.

### 5.3 IngredientsList + ServingsStepper

- H2: **"Ingredients"**
- Stepper on the same row: label **"Servings"**, minus button (lucide `Minus`), value, plus button (lucide `Plus`). Range 1–8; initial value = recipe's base `servings`. Buttons disable at bounds.
- Each ingredient row: amount + unit + name, e.g. **"300 g chicken breast"**. Amounts rescale linearly by `selectedServings / baseServings`.
- Rounding: scaled values < 10 display to 1 decimal (trailing `.0` dropped); ≥ 10 round to whole numbers. Ingredients with `amount: null` (e.g. **"sea salt, to taste"**) render name only and never rescale.

**Motion:** on stepper change, each amount number crossfades (150ms). Stepper buttons scale 0.9 on tap.

### 5.4 StepsChecklist

- H2: **"Method"**
- Numbered list of steps; each row is a checkbox toggle. Checked steps show a leaf-green check, number badge fills green, and text dims to stone-600 with strike-through.
- Progress caption above list: **"0 of 7 steps done"**, live-updating.
- State is per-visit (not persisted).

### 5.5 NutritionPanel

- H2: **"Nutrition per serving"**
- **MacroDonut** (SVG): three arc segments — protein (leaf green #16A34A), carbs (orange #F97316), fat (amber #EAB308) — proportioned by calorie contribution (protein g × 4, carbs g × 4, fat g × 9, normalized). Center: kcal value (Bricolage 700) over the caption **"kcal / serving"**.
- Three **MacroRing**s beside/below the donut, one per macro. Each ring fills to that macro's share of calories, colored as above, with the gram value centered (e.g. **"42 g"**) and label beneath: **"Protein"**, **"Carbs"**, **"Fat"**, plus its percent caption (e.g. **"32% of calories"**).

**Motion:** donut segments and rings animate stroke from 0 to value over 900ms (ease-standard) when the panel first enters the viewport. Center kcal counts up over 700ms via `AnimatedNumber`. Under reduced motion, everything renders instantly at final values.

**Responsive:** 375px — everything stacked in section order; nutrition rings in a 3-across row under the donut. 768px — ingredients and steps side-by-side (5/12 + 7/12); nutrition panel full-width below. 1024px+ — main column (ingredients then steps) with NutritionPanel as a sticky right aside (4/12).

### 5.6 Unknown id

If `:id` matches no recipe, render `EmptyState` in place of the page: icon `CookingPot`, title **"Recipe not found"**, body **"That link doesn't match anything in the collection."**, button **"Browse all recipes"** → `/recipes`.

### Detail acceptance criteria

- Given a recipe with base 2 servings listing "300 g chicken breast", When servings is stepped to 3, Then the row reads **"450 g chicken breast"**.
- Given the stepper is at 1, When minus is pressed, Then nothing changes and the button is visibly disabled (same at 8 for plus).
- Given a "to taste" ingredient, When servings change, Then its row is unchanged.
- Given a recipe with protein 42 g, carbs 38 g, fat 21 g, kcal 520, When the panel mounts, Then the protein ring fills to 32% (42×4/520), carbs to 29%, fat to 36%, and the donut segments match the same shares.
- Given 3 of 7 steps checked, When a fourth is checked, Then the caption reads **"4 of 7 steps done"**.
- Given `prefers-reduced-motion: reduce`, When the panel mounts, Then rings and kcal render at final values with no animation.
- Given `/recipes/does-not-exist`, When the route resolves, Then the not-found state renders with a working link back to `/recipes`.

## 6. Planner — `/planner`

Sections in order: page header + target row → WeekBoard (or empty-week banner above it).

### 6.1 Header and target row

- H1: **"Your week"**
- Target row: **"Daily target: 2,000 kcal"** (value from `nutriplan-target`, default 2,000) + link **"Recalculate →"** → `/calculator`.

### 6.2 WeekBoard

Seven `DayColumn`s, Monday → Sunday. Each column contains:

- Day header: name (**"Monday"** … **"Sunday"**) + ghost **"Clear day"** button (visible only when the day has ≥ 1 meal).
- `DayCalorieBar`: text **"1,450 / 2,000 kcal"** over a progress track. Fill is leaf green up to 100%; when over target the fill turns red-600 and a caption appears: **"220 kcal over"**.
- Three `MealSlot`s labeled **"Breakfast"**, **"Lunch"**, **"Dinner"**.
  - Empty slot: dashed-border button **"+ Add meal"** → opens `RecipePickerModal` for that day + meal.
  - Filled slot: `PlannedMealCard` — recipe thumbnail, title, **"520 kcal"**, and a remove button (lucide `X`, `aria-label` **"Remove Grilled Lemon Chicken Bowl from Monday lunch"**). Card title links to the recipe detail.

Each planned meal counts one serving of the recipe; a day's total is the sum of its filled slots' per-serving kcal.

### 6.3 RecipePickerModal

- Modal title: **"Add to Tuesday · Lunch"** (day + slot injected).
- Search input, placeholder **"Search recipes…"**, autofocused on open.
- Scrollable list of all recipes (filtered by search): thumbnail, title, **"520 kcal · 25 min"**. Clicking a row (or `Enter` on a focused row) writes the recipe to the slot, closes the modal, and returns focus to the originating slot.
- Empty search result: **"Nothing matches — try another word."**
- Close: `X` button, `Esc`, or backdrop click. Focus is trapped inside while open; body scroll locked.

### 6.4 Empty week

When all 21 slots are empty, a banner renders above the board: icon `CalendarPlus`, title **"Plan your first meal"**, body **"Tap + Add meal in any slot, or start from the recipe list."**, secondary button **"Browse recipes"** → `/recipes`.

### 6.5 Persistence

The whole board reads/writes `localStorage` key **`nutriplan-plan`** on every change (shape in TECHNICAL-PLAN.md §4.3). Corrupt or unparseable stored data resets silently to an empty week.

**Motion:** adding a meal animates the `PlannedMealCard` in (scale 0.9 → 1 + fade, spring); removing animates out via `AnimatePresence` (fade + scale 0.9, 250ms) while surrounding cards reflow with `layout` animations. **"Clear day"** removes that day's cards with a 60ms stagger. The calorie bar fill animates width 400ms on any total change. Modal: backdrop fade 250ms, panel rises 16px with spring.

**Responsive:** 375px — days stack vertically as full-width cards in weekday order. 768px — horizontal scroll-snap board, 240px columns, ~3 visible, snap per column; a subtle right-edge fade hints at overflow. 1024px+ — same scroll board with ~4–5 visible; at ≥1280px all 7 columns fit a grid without scrolling.

### Planner acceptance criteria

- Given an empty Monday breakfast slot, When the user picks "Overnight Berry Oats" in the modal, Then the card appears in that slot, the modal closes, and Monday's total increases by that recipe's kcal.
- Given a filled slot, When its remove button is activated, Then the card animates out and the day total decreases accordingly.
- Given Monday holds 3 meals, When **"Clear day"** is clicked, Then all three slots empty, the total reads **"0 / 2,000 kcal"**, and other days are untouched.
- Given a planned week, When the page is reloaded, Then the identical board state renders from `nutriplan-plan`.
- Given `nutriplan-plan` contains invalid JSON, When `/planner` loads, Then an empty week renders and the key is rewritten with the empty shape (no crash).
- Given a day totaling 2,220 kcal against a 2,000 target, When the bar renders, Then the fill is red and the caption reads **"220 kcal over"**.
- Given the picker modal is open, When `Tab` is pressed repeatedly, Then focus cycles only within the modal; `Esc` closes it and focus returns to the **"+ Add meal"** button that opened it.
- Given a filled slot, When the user opens the picker from a different empty slot and selects a recipe already used elsewhere, Then it is added again (duplicates across slots are allowed).

## 7. Calculator — `/calculator`

Sections in order: page header → CalculatorForm → ResultsPanel (with GoalPresets).

### 7.1 Header

- H1: **"Know your numbers"**
- Subline: **"Estimate what your body burns, pick a goal, and send the target straight to your planner."**

### 7.2 CalculatorForm

| Field | Control | Rules / copy |
|---|---|---|
| Gender | Segmented control: **"Female"** / **"Male"** | Required; no default. Error: **"Pick an option."** |
| Age | Number input, suffix **"years"** | 15–90. Error: **"Enter an age between 15 and 90."** |
| Height | Number input, suffix **"cm"** | 120–230. Error: **"Enter a height between 120 and 230 cm."** |
| Weight | Number input, suffix **"kg"** | 35–250. Error: **"Enter a weight between 35 and 250 kg."** |
| Activity level | Select, label **"Activity level"** | Required; options below |

Activity options (label → multiplier): **"Sedentary — desk day, little exercise"** ×1.2 · **"Lightly active — 1–3 workouts a week"** ×1.375 · **"Moderately active — 3–5 workouts a week"** ×1.55 · **"Very active — 6–7 workouts a week"** ×1.725 · **"Athlete — physical job or two-a-days"** ×1.9.

Submit button: **"Calculate"**. Empty required fields error: **"This field is required."** Errors render red-600 under the field; first invalid field receives focus on submit.

Formula (Mifflin-St Jeor): male `BMR = 10·kg + 6.25·cm − 5·age + 5`; female `BMR = 10·kg + 6.25·cm − 5·age − 161`. `TDEE = BMR × multiplier`. Both rounded to whole kcal.

### 7.3 ResultsPanel + GoalPresets

Pre-calculation state: **"Your results will land here — fill in the form and hit Calculate."**

After calculating:

- **"Your BMR"** — value (e.g. **"1,648"**) + caption **"kcal / day at rest"**.
- **"Your TDEE"** — value + caption **"kcal / day with activity"**.
- H3: **"Pick a goal"** — three `GoalPresets` chips: **"Lose weight −500"**, **"Maintain ±0"** (default selected), **"Gain muscle +300"**.
- **"Daily calorie target"** — `TDEE + adjustment`, rounded to the nearest 10 (e.g. **"2,150 kcal"**).
- Button: **"Save as planner target"**. On save, writes the target to `localStorage` key **`nutriplan-target`** and shows inline confirmation: **"Saved — your planner now tracks 2,150 kcal."** with link **"Open planner →"** → `/planner`.

**Motion:** on calculate, BMR, TDEE, and target values count up from 0 (or crossfade from previous values on recalculation) over 700ms via `AnimatedNumber`; the two result cards fade-up staggered 60ms. Switching a goal preset animates the target number from old to new value (700ms). Reduced motion: values swap instantly.

**Responsive:** 375px — form then results, single column. 768px — same stacked layout, wider fields in a 2-col field grid. 1024px+ — two columns: form left (7/12), sticky ResultsPanel right (5/12).

### Calculator acceptance criteria

- Given Female, 30 years, 165 cm, 60 kg, Moderately active, When **"Calculate"** is pressed, Then BMR shows **"1,320"** and TDEE shows **"2,046"** (10·60 + 6.25·165 − 5·30 − 161 = 1,320.25 → 1,320; ×1.55 = 2,046).
- Given a computed TDEE of 2,046 with **"Maintain ±0"**, When **"Lose weight −500"** is selected, Then the target animates to **"1,550 kcal"** (2,046 − 500 = 1,546 → nearest 10 = 1,550).
- Given age 12 is entered, When submitting, Then the form does not calculate and the age error message renders.
- Given a target of 1,550 is saved, When the user opens `/planner`, Then the target row reads **"Daily target: 1,550 kcal"** and all day bars measure against 1,550.
- Given no prior save, When `/planner` loads, Then the target defaults to 2,000 kcal.
- Given results are visible, When any form value changes, Then results remain until **"Calculate"** is pressed again (no live recompute).

## 8. Cross-cutting requirements

### 8.1 Responsive summary

| Breakpoint | Rules |
|---|---|
| 375px (mobile) | Single column everywhere; hamburger nav; recipes grid 1-up; filters in collapsible disclosure; planner days stacked vertically; calculator stacked. No horizontal page scroll. |
| 768px (tablet) | Nav inline; recipes grid 2-up; filters expanded; planner horizontal scroll-snap (~3 columns); detail page 2-col ingredients/steps. |
| 1024px+ (desktop) | Recipes grid 3-up; single-row filter bar; detail page sticky nutrition aside; planner shows 4–5 columns (all 7 at ≥1280px); calculator 2-col with sticky results. |

Content max-width 1152px, centered; gutters 16 / 24 / 32px by breakpoint.

### 8.2 Motion and reduced motion

All motion uses the tokens in DESIGN-SYSTEM.md §6. When `prefers-reduced-motion: reduce` is set (checked via Motion's `useReducedMotion`): no entrance, hover-lift, layout, or stagger animations; rings, donut, bars, and numbers render instantly at final values; modal and mobile menu use opacity-only 150ms transitions.

### 8.3 Accessibility

- Semantic landmarks: `header`, `nav`, `main`, `footer`; one `h1` per page.
- Filter chips: `<button aria-pressed>`. Sliders: native `<input type="range">` with visible labels and value readouts. Steps checklist: real checkboxes. Stepper buttons: `aria-label` **"Decrease servings"** / **"Increase servings"**.
- Donut and rings: `role="img"` with labels like **"Protein: 42 grams, 32% of calories"**; values also present as visible text.
- Modal: `role="dialog"`, `aria-modal`, labelled by its title, focus-trapped, `Esc` to close, focus restore on close.
- Calorie bars: `role="progressbar"` with `aria-valuenow/min/max` and text alternative.
- All interactive targets ≥ 44×44px on touch; visible focus ring everywhere.

## 9. Non-goals

- No drag-and-drop planner interactions; no reordering within a day.
- No accounts, favorites, ratings, comments, or sharing.
- No shopping list, pantry, or export features.
- No imperial units, no micronutrients, no per-slot serving multipliers.
- No dark mode. No backend or network data fetching of any kind.
