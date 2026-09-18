# NutriPlan — Technical Plan

Stack, structure, components, data shapes, state, motion implementation, and build milestones for NutriPlan.

| | |
|---|---|
| **Project** | NutriPlan |
| **Document** | Technical Plan |
| **Status** | Approved |
| **Owner** | Ziad |
| **Date** | 2026-08-28 |

---

## 1. Dependencies

| Package | Version | Role |
|---|---|---|
| `react` | ^19.1.0 | UI runtime |
| `react-dom` | ^19.1.0 | DOM renderer |
| `react-router-dom` | ^7.8.0 | Routing (`/`, `/recipes`, `/recipes/:id`, `/planner`, `/calculator`) |
| `motion` | ^12.23.0 | Framer Motion — all animation (import from `motion/react`) |
| `lucide-react` | ^0.540.0 | Icons |
| `vite` | ^7.1.0 (dev) | Build tool |
| `@vitejs/plugin-react` | ^5.0.0 (dev) | React fast refresh + JSX |
| `tailwindcss` | ^4.1.0 (dev) | Styling |
| `@tailwindcss/vite` | ^4.1.0 (dev) | Tailwind v4 Vite plugin |

No chart library — the donut and rings are hand-rolled SVG. No state library — React built-ins + custom hooks.

## 2. Folder structure — `src/`

```
src/
├── main.jsx                  # createRoot + <BrowserRouter> + <App/>
├── App.jsx                   # <Routes>: RootLayout wraps the 5 pages; * → <Navigate to="/">
├── index.css                 # @import "tailwindcss"; @theme tokens; font imports; base styles
├── assets/
│   ├── hero/
│   │   └── home-hero.webp            # 1600×1200, ≤ 220 KB
│   └── recipes/                      # 30 photos, <recipe-id>.webp, 1200×900 (4:3), ≤ 180 KB each
├── pages/
│   ├── HomePage.jsx
│   ├── RecipesPage.jsx
│   ├── RecipeDetailPage.jsx
│   ├── PlannerPage.jsx
│   └── CalculatorPage.jsx
├── components/
│   ├── layout/
│   │   ├── RootLayout.jsx
│   │   ├── Navbar.jsx
│   │   └── Footer.jsx
│   ├── ui/
│   │   ├── Button.jsx
│   │   ├── Badge.jsx
│   │   ├── FilterChip.jsx
│   │   ├── RangeSlider.jsx
│   │   ├── Modal.jsx
│   │   ├── EmptyState.jsx
│   │   └── AnimatedNumber.jsx
│   ├── home/
│   │   ├── Hero.jsx
│   │   ├── HowItWorks.jsx
│   │   └── FeaturedRecipes.jsx
│   ├── recipes/
│   │   ├── RecipeCard.jsx
│   │   ├── RecipeGrid.jsx
│   │   ├── RecipeFilters.jsx
│   │   ├── RecipeHero.jsx
│   │   ├── ServingsStepper.jsx
│   │   ├── IngredientsList.jsx
│   │   ├── StepsChecklist.jsx
│   │   ├── NutritionPanel.jsx
│   │   ├── MacroDonut.jsx
│   │   └── MacroRing.jsx
│   ├── planner/
│   │   ├── WeekBoard.jsx
│   │   ├── DayColumn.jsx
│   │   ├── MealSlot.jsx
│   │   ├── PlannedMealCard.jsx
│   │   ├── DayCalorieBar.jsx
│   │   └── RecipePickerModal.jsx
│   └── calculator/
│       ├── CalculatorForm.jsx
│       ├── ResultsPanel.jsx
│       └── GoalPresets.jsx
├── data/
│   ├── recipes.js            # 30 recipe objects + featuredRecipeIds
│   └── activityLevels.js     # 5 activity options
├── hooks/
│   ├── useLocalStorage.js
│   ├── usePlan.js
│   └── useTarget.js
└── lib/
    ├── calculations.js       # bmr, tdee, macroShares, scaleAmount, dayTotal
    └── format.js             # formatKcal, formatAmount, formatMinutes
```

Repo root also carries `vercel.json` (SPA rewrite, §8) and `index.html` (font `<link>`s, meta tags).

## 3. Component inventory

| Component | Purpose | Key props |
|---|---|---|
| `RootLayout` | Navbar + `<Outlet/>` + Footer; scroll-to-top on route change | — |
| `Navbar` | Sticky nav, active link states, mobile hamburger sheet | — |
| `Footer` | Site links, disclaimer, GitHub link | — |
| `Button` | Shared button/link (renders `<Link>` when `to` given) | `variant: "primary"\|"secondary"\|"ghost"\|"danger"`, `size: "md"\|"sm"`, `to`, `onClick`, `disabled` |
| `Badge` | Pill metadata label (kcal, time, diet, servings) | `tone: "orange"\|"green"\|"neutral"`, `icon`, `children` |
| `FilterChip` | Toggleable filter pill with `aria-pressed` | `label`, `selected`, `onToggle` |
| `RangeSlider` | Labeled range input with live readout ("Any" at max) | `label`, `min`, `max`, `step`, `value`, `unit`, `onChange` |
| `Modal` | Focus-trapped dialog: backdrop, panel, `Esc`/backdrop close, scroll lock, focus restore | `open`, `title`, `onClose`, `children` |
| `EmptyState` | Icon + title + body + optional action; used for no-results, empty week, picker no-match, recipe not-found | `icon`, `title`, `body`, `actionLabel`, `onAction` (or `actionTo`) |
| `AnimatedNumber` | Animates numeric text between values; instant under reduced motion | `value`, `duration`, `format` |
| `Hero` | Home hero: copy stack, CTAs, photo, mount stagger | — |
| `HowItWorks` | Three-step explainer cards, whileInView stagger | — |
| `FeaturedRecipes` | Heading + three `RecipeCard`s from `featuredRecipeIds` | — |
| `RecipeCard` | Photo card with badges; links to detail; hover lift | `recipe` |
| `RecipeGrid` | Responsive card grid with layout animation on filter change | `recipes` |
| `RecipeFilters` | Search, cuisine/diet chip groups, two sliders, clear button; mobile disclosure | `filters`, `onChange`, `onClear`, `resultCount` |
| `RecipeHero` | Detail photo, title, description, badge row | `recipe` |
| `ServingsStepper` | −/+ stepper, clamps 1–8 | `value`, `onChange`, `min`, `max` |
| `IngredientsList` | Scaled ingredient rows | `ingredients`, `baseServings`, `servings` |
| `StepsChecklist` | Numbered checkbox steps + progress caption | `steps` |
| `NutritionPanel` | "Nutrition per serving": `MacroDonut` + three `MacroRing`s | `recipe` |
| `MacroDonut` | SVG donut, three arc segments by calorie share, kcal center | `kcal`, `protein`, `carbs`, `fat`, `size` |
| `MacroRing` | Single SVG progress ring, gram value + label + percent | `label`, `grams`, `percent`, `color`, `size` |
| `WeekBoard` | Seven `DayColumn`s; layout by breakpoint | `plan`, `target`, `onAdd`, `onRemove`, `onClearDay` |
| `DayColumn` | Day header, clear-day button, calorie bar, three slots | `day`, `meals`, `total`, `target`, `onAdd`, `onRemove`, `onClearDay` |
| `MealSlot` | One breakfast/lunch/dinner cell: add button or planned card | `day`, `meal`, `recipe`, `onAdd`, `onRemove` |
| `PlannedMealCard` | Thumbnail, title, kcal, remove button; animated in/out | `recipe`, `onRemove`, `removeLabel` |
| `DayCalorieBar` | Progress bar + "1,450 / 2,000 kcal" + over-target state | `total`, `target` |
| `RecipePickerModal` | Modal with search + recipe rows; commits selection to slot | `open`, `day`, `meal`, `onSelect`, `onClose` |
| `CalculatorForm` | Gender segment, age/height/weight inputs, activity select, validation, submit | `onCalculate` |
| `ResultsPanel` | BMR/TDEE cards, `GoalPresets`, target, save action, pre-results state | `results` (`{bmr, tdee}` or `null`), `onSaveTarget` |
| `GoalPresets` | Three goal chips (−500 / ±0 / +300) | `value`, `onChange` |
| `HomePage` / `RecipesPage` / `RecipeDetailPage` / `PlannerPage` / `CalculatorPage` | Route pages composing the above; own page-level state | route params only |

## 4. Mock data shapes

### 4.1 Recipe — `src/data/recipes.js`

```js
// export const recipes = [ ...30 of these ]
{
  id: "grilled-lemon-chicken-bowl",        // slug; also the image filename and route param
  title: "Grilled Lemon Chicken Bowl",
  description: "Charred chicken over herbed quinoa with cucumber and a garlic-yogurt drizzle.",
  cuisine: "Mediterranean",                 // one of the 6 cuisines
  diets: ["high-protein"],                  // 0..n of: "vegan" | "vegetarian" | "high-protein" | "keto"
  kcal: 520,                                // per serving
  protein: 42,                              // grams per serving
  carbs: 38,
  fat: 21,
  prepTime: 25,                             // minutes
  servings: 2,                              // base servings the ingredient amounts describe
  image: grilledLemonChickenBowl,           // imported from assets/recipes/grilled-lemon-chicken-bowl.webp
  ingredients: [
    { name: "chicken breast", amount: 300, unit: "g" },
    { name: "quinoa", amount: 120, unit: "g" },
    { name: "sea salt", amount: null, unit: null }   // null amount = "to taste", never rescaled
  ],
  steps: [
    "Season the chicken with lemon zest, oregano, salt, and pepper.",
    "Grill 5–6 minutes per side until cooked through; rest 5 minutes."
    // 4–8 steps per recipe
  ]
}

export const featuredRecipeIds = [
  "grilled-lemon-chicken-bowl",
  "rainbow-tofu-stir-fry",
  "green-goddess-grain-salad"
];
```

Authoring distribution across the 30 recipes: 5 per cuisine (Mediterranean, Italian, Asian, Mexican, Middle Eastern, American); ≥ 6 vegan, ≥ 8 vegetarian, ≥ 8 high-protein, ≥ 5 keto (tags overlap); kcal range 280–780; prepTime range 10–45; servings 1–4. Macro sanity rule: `protein*4 + carbs*4 + fat*9` within ±5% of `kcal`.

### 4.2 Activity levels — `src/data/activityLevels.js`

```js
export const activityLevels = [
  { id: "sedentary",  label: "Sedentary — desk day, little exercise",     multiplier: 1.2   },
  { id: "light",      label: "Lightly active — 1–3 workouts a week",      multiplier: 1.375 },
  { id: "moderate",   label: "Moderately active — 3–5 workouts a week",   multiplier: 1.55  },
  { id: "very",       label: "Very active — 6–7 workouts a week",         multiplier: 1.725 },
  { id: "athlete",    label: "Athlete — physical job or two-a-days",      multiplier: 1.9   }
];
```

### 4.3 Plan (persisted shape)

```js
// value stored under "nutriplan-plan" (JSON.stringify'd)
{
  monday:    { breakfast: "overnight-berry-oats", lunch: null, dinner: "grilled-lemon-chicken-bowl" },
  tuesday:   { breakfast: null, lunch: null, dinner: null },
  wednesday: { breakfast: null, lunch: null, dinner: null },
  thursday:  { breakfast: null, lunch: null, dinner: null },
  friday:    { breakfast: null, lunch: null, dinner: null },
  saturday:  { breakfast: null, lunch: null, dinner: null },
  sunday:    { breakfast: null, lunch: null, dinner: null }
}
// slot values are recipe ids or null; ids that no longer resolve are dropped on load
```

## 5. State and persistence

| localStorage key | Value | Default | Written by | Read by |
|---|---|---|---|---|
| `nutriplan-plan` | Plan object (§4.3), JSON | all-null week | `usePlan` on every add/remove/clear | `PlannerPage` |
| `nutriplan-target` | Number (kcal), JSON | `2000` when absent | `useTarget` via "Save as planner target" | `PlannerPage`, `CalculatorPage` |

- `useLocalStorage(key, defaultValue)` — generic: lazy `useState` initializer wraps `JSON.parse` in try/catch (parse failure → default + immediate rewrite); `useEffect` writes on change; SSR-safe guard unnecessary (client-only) but `typeof window` check kept for tests.
- `usePlan()` — wraps `useLocalStorage("nutriplan-plan", emptyPlan)`; exposes `plan`, `addMeal(day, meal, recipeId)`, `removeMeal(day, meal)`, `clearDay(day)`, `dayTotal(day)` (resolves ids against `recipes`, sums `kcal`, silently skips unresolvable ids).
- `useTarget()` — wraps `useLocalStorage("nutriplan-target", 2000)`; exposes `target`, `saveTarget(kcal)`.
- All remaining state is page-local `useState`: filter state in `RecipesPage`, servings + checked steps in `RecipeDetailPage`, form/results/goal in `CalculatorPage`, open-modal slot in `PlannerPage`. No context, no store.
- Cross-tab `storage` event sync is intentionally omitted (single-tab portfolio app; noted in DECISIONS.md D6).

## 6. Animation implementation notes

All imports from `motion/react`. Every effect checks `useReducedMotion()`; when true, pass `initial={false}` / render final values directly.

| Effect | Implementation |
|---|---|
| Card hover lift | `motion.article whileHover={{ y: -4 }}` + CSS `transition-shadow` (shadow-card → shadow-lift); image scale via CSS `group-hover:scale-103` 250ms |
| Filter chip toggle | `motion.button whileTap={{ scale: 0.95 }}`; selected fill/color via CSS transition 250ms; `aria-pressed` drives styling |
| Grid reflow on filter | `motion.div layout` on each card wrapper inside `<AnimatePresence>`; exit `{ opacity: 0, scale: 0.96 }` 250ms; spring-layout token for position |
| Macro rings / donut mount | `motion.circle` with `strokeDasharray = C`, animate `strokeDashoffset` from `C` to `C·(1−pct)`; `transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}`; triggered by `whileInView` `once: true`; donut = 3 stacked circles with rotation offsets accumulating shares |
| Animated numbers (kcal center, BMR/TDEE/target) | `AnimatedNumber`: `useMotionValue` + `animate(mv, value, { duration: 0.7, ease: [0.22, 1, 0.36, 1] })` in an effect; render `Math.round` via `useTransform` + `<motion.span>` |
| Planner add/remove | `<AnimatePresence>` around `PlannedMealCard`; enter `initial={{ opacity: 0, scale: 0.9 }}` → spring (stiffness 350, damping 32); exit `{ opacity: 0, scale: 0.9 }` 250ms; `layout` on `MealSlot` children for reflow; clear-day staggers exits 60ms via `custom` delay |
| Day calorie bar | `motion.div animate={{ width: pct + "%" }}` 400ms ease-standard; color swap green→red via CSS class |
| Modal / mobile menu | `<AnimatePresence>`: backdrop `opacity` 250ms; panel `{ y: 16, opacity: 0 }` → spring; menu items `staggerChildren: 0.06` |
| Hero entrance | Parent `variants` with `staggerChildren: 0.09`; children `{ opacity: 0, y: 12 }` → `{ opacity: 1, y: 0 }` 400ms |
| Servings amount change | Key each amount `<motion.span key={value}>` with 150ms fade; stepper buttons `whileTap={{ scale: 0.9 }}` |
| HowItWorks scroll-in | `whileInView={{ opacity: 1, y: 0 }}` `viewport={{ once: true, margin: "-80px" }}`, stagger 60ms |

## 7. Build milestones

| # | Milestone | Definition of done |
|---|---|---|
| M1 | **Foundation** — Vite 7 + React 19 scaffold, Tailwind v4 wired with full `@theme` token set from DESIGN-SYSTEM.md, Google Fonts loaded, router with `RootLayout`, `Navbar` (incl. mobile sheet), `Footer`, five stub pages, `*` redirect | All 5 routes navigable with shared shell; tokens usable as utilities; deployed preview URL on Vercel renders |
| M2 | **Data + browsing** — author all 30 recipes with validated macros, source/compress 30 photos + hero, build `RecipeCard`, `RecipeGrid`, `RecipeFilters`, `FilterChip`, `RangeSlider`, `Badge`, `EmptyState`; full filter logic | Every filter combination returns the correct subset (spot-checked against the data); empty state + clear-all works; grid is 1/2/3-up at 375/768/1024; count line correct |
| M3 | **Recipe detail** — `RecipeHero`, `ServingsStepper`, `IngredientsList` scaling + rounding rules, `StepsChecklist`, `NutritionPanel` with `MacroDonut` + `MacroRing` mount animation, unknown-id state | Amount math correct at servings 1–8 incl. null amounts; ring/donut percentages match macro math for all 30 recipes (unit-check 3); reduced motion renders static; `/recipes/nonsense` shows not-found |
| M4 | **Planner** — `usePlan` + `useLocalStorage`, `WeekBoard`/`DayColumn`/`MealSlot`/`PlannedMealCard`/`DayCalorieBar`, `RecipePickerModal` on shared `Modal`, clear-day, empty-week banner, add/remove/clear layout animations | Plan survives reload via `nutriplan-plan`; corrupt JSON recovers; totals and over-target state correct; modal is focus-trapped and keyboard-complete; board layouts match PRD at all 3 breakpoints |
| M5 | **Calculator** — `CalculatorForm` with validation, Mifflin-St Jeor in `lib/calculations.js`, `ResultsPanel`, `GoalPresets`, `AnimatedNumber`, target save via `useTarget` | PRD worked example (F/30/165/60/moderate → 1,320 / 2,046 / presets) verified; validation messages per spec; saved target reflected on `/planner`; count-ups run and respect reduced motion |
| M6 | **Home** — `Hero`, `HowItWorks`, `FeaturedRecipes` with entrance/stagger motion | Copy matches PRD verbatim; featured ids resolve; no CLS from hero image; links route correctly |
| M7 | **Motion + a11y polish** — reduced-motion audit of every effect, focus-visible pass, aria labels (chips, stepper, rings, bars, modal), landmark/heading audit, keyboard walkthrough of all five pages | axe DevTools reports 0 issues on all routes; every acceptance-criterion flow completable keyboard-only; `prefers-reduced-motion` leaves zero moving pixels |
| M8 | **Ship** — 375/768/1024 QA sweep, image/bundle budget check, meta + OG tags, `vercel.json` rewrite, README with screenshots, production deploy | BRIEF.md success-criteria table fully green on the production URL |

## 8. Performance notes

- **Images:** all WebP; recipe cards `loading="lazy"` with explicit `width`/`height`; hero image eager + `fetchpriority="high"`. Budget: ≤ 180 KB per recipe photo, ≤ 220 KB hero.
- **Code:** `PlannerPage` and `CalculatorPage` lazy-loaded via `React.lazy` + route-level `Suspense` (recipe browsing is the entry path). Initial gzip JS budget 180 KB.
- **Fonts:** Google Fonts `<link>` with `preconnect` to `fonts.googleapis.com` / `fonts.gstatic.com`, `display=swap`, only the weights in DESIGN-SYSTEM.md §3.
- **SPA hosting:** `vercel.json` → `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }` so `/recipes/:id` deep links resolve.
- **Rendering:** filter results via `useMemo` keyed on filter state; recipe lookup map (`Map` by id) built once at module scope; no re-render storms from sliders (debounced search only — range inputs are cheap).

## 9. Accessibility notes

- Implementation specifics live in PRD §8.3; this plan adds: focus trap implemented inside `Modal` (sentinel elements + `Tab` cycling, `inert` not required), `aria-live="polite"` on the recipes result count, steps-progress caption, and calculator save confirmation so screen readers hear updates.
- Ring/donut SVGs get `role="img"` + `aria-label`; decorative motion wrappers stay `aria-hidden`-free (they wrap real content).
- Color is never the only signal: over-target bars add the "kcal over" caption; checked steps add strike-through + check icon; selected chips change fill *and* carry `aria-pressed`.
