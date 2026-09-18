# NutriPlan — Decision Log

The twelve build-shaping decisions behind NutriPlan, each with the options weighed and the trade-offs accepted.

| | |
|---|---|
| **Project** | NutriPlan |
| **Document** | Decision Log |
| **Status** | Approved |
| **Owner** | Ziad |
| **Date** | 2026-08-28 |

---

Decisions are numbered D1–D12 and referenced by number from the other docs (TECHNICAL-PLAN.md §5 cites D6; DESIGN-SYSTEM.md §1 cites D8). A decision is only revisited if its Consequences stop being acceptable.

## D1 — Framework: React 19 on Vite 7

**Context.** NutriPlan is one project in a multi-project front-end portfolio with a shared stack convention. It needs five interactive routes, derived state everywhere (compound filters, ingredient rescaling, per-day totals), and fast local iteration.

**Options considered.**
1. React 19 + Vite 7 (workspace convention).
2. Next.js App Router — file-based routing and image optimization built in.
3. Svelte 5 / SvelteKit — smaller runtime, less boilerplate.

**Decision.** React 19 with Vite 7 and `@vitejs/plugin-react`.

**Rationale.** The portfolio's stated goal is demonstrating React depth to recruiters, and the workspace convention pins every project to Vite 7 + React 19 so skills and tooling transfer across projects. Next.js adds a server-oriented mental model (RSC boundaries, caching layers) that buys nothing for a front-end-only static site and muddies the "no backend" story. Svelte would fragment the portfolio's narrative.

**Consequences.** Routing, image handling, and meta tags are our own responsibility (covered by D3, D9, and the M8 milestone). Bundle stays lean because Vite tree-shakes and the route-level `React.lazy` split in TECHNICAL-PLAN.md §8 keeps the initial gzip budget at 180 KB.

## D2 — Styling: Tailwind CSS v4 with `@theme` tokens

**Context.** The design system defines a tight token set (15 colors, 9 type styles, 4 radii, 3 shadows, motion tokens) that must be applied consistently across five pages and ~35 components.

**Options considered.**
1. Tailwind CSS v4 with all tokens declared in `@theme` (workspace convention).
2. CSS Modules + hand-written custom properties.
3. A component library (Radix Themes, MUI) restyled to the palette.

**Decision.** Tailwind v4 via `@tailwindcss/vite`, with the entire DESIGN-SYSTEM.md token set declared once in `@theme` inside `src/index.css`.

**Rationale.** Tailwind v4's `@theme` makes the design system executable: `cream-50`, `green-600`, `radius-xl`, and the type scale become real utilities, so drift between docs and code is visible in a class name. CSS Modules would re-invent that mapping by hand. A component library fights the food-forward visual identity and pads the bundle with unstyled surface area — and building `Button`, `Modal`, and `FilterChip` from scratch is portfolio evidence, not overhead.

**Consequences.** Every color, radius, and shadow in the codebase must come from the token set — arbitrary values in class names are treated as review failures. Component specs live in DESIGN-SYSTEM.md §5 rather than a Storybook.

## D3 — Routing: react-router-dom v7 with BrowserRouter

**Context.** NutriPlan is explicitly a multi-page app: five routes including the dynamic `/recipes/:id`, all deep-linkable from a static host, sharing one Navbar/Footer shell.

**Options considered.**
1. react-router-dom v7 with `BrowserRouter` and a layout route (workspace convention for multi-page projects).
2. Hash routing (`HashRouter`) — no server config needed.
3. Single-page tab switching with `useState` — no router at all.

**Decision.** react-router-dom v7: `BrowserRouter` in `main.jsx`, a `RootLayout` layout route wrapping the five pages, `useParams` for `/recipes/:id`, and `*` → `<Navigate to="/">`.

**Rationale.** Clean URLs are part of the recruiter-facing polish — `/recipes/grilled-lemon-chicken-bowl` reads like a product, `/#/recipes/...` reads like a workaround. State-based tabs would forfeit the routing skill the BRIEF lists as portfolio goal #1 and break shareable links entirely. The static-host refresh problem hash routing avoids is solved by one rewrite rule (D10).

**Consequences.** Deployment requires the SPA rewrite in `vercel.json` (TECHNICAL-PLAN.md §8). `RootLayout` owns scroll-to-top on route change. Active nav states come free via `NavLink`.

## D4 — Animation: Framer Motion (`motion` package), no GSAP

**Context.** The motion inventory is large and state-driven: grid reflow on filter change, `AnimatePresence` exits on planner remove, spring modal entrances, stroke-dash ring fills, number count-ups — all of it gated behind `prefers-reduced-motion`.

**Options considered.**
1. Framer Motion via the `motion` npm package (workspace convention).
2. GSAP — timeline power, `ScrollTrigger`.
3. CSS transitions/animations only.

**Decision.** Framer Motion, imported from `motion/react`, as the single animation dependency. Trivial hover color/shadow transitions stay in CSS.

**Rationale.** Nearly every animation in the PRD is tied to React state entering or leaving the tree — exactly what `AnimatePresence` and `layout` animations exist for; in GSAP those are manual choreography against React's render cycle. `useReducedMotion` gives one hook to honor the accessibility requirement everywhere. CSS alone cannot animate exit states or FLIP-reflow the recipe grid. GSAP is reserved in the workspace for nova-studio, keeping each project's animation story distinct.

**Consequences.** The spring/duration/stagger values in DESIGN-SYSTEM.md §4 map directly onto Motion props (TECHNICAL-PLAN.md §6). Motion's tree-shaken core is accounted for inside the 180 KB JS budget. No scroll-scrubbed effects — `whileInView` entrances are the ceiling, which suits the product's calm tone.

## D5 — Data: 30 hand-authored recipes as a local module

**Context.** Front-end-only constraint: no backend, no database. The app still needs a credible dataset — filterable on five axes, with macros accurate enough that the donut math and planner totals hold up under inspection.

**Options considered.**
1. Hand-author 30 recipes in `src/data/recipes.js` (workspace convention: local mock JSON modules).
2. Fetch from a free recipe API (TheMealDB, Spoonacular) at runtime.
3. Generate ~200 recipes with a script.

**Decision.** Thirty hand-authored recipe objects in `src/data/recipes.js`, statically imported, with the authoring distribution and the `protein×4 + carbs×4 + fat×9 ≈ kcal ±5%` sanity rule from TECHNICAL-PLAN.md §4.1.

**Rationale.** A runtime API breaks the offline/static story, adds keys, rate limits, and loading states, and its data lacks reliable macros — the one field NutriPlan's whole premise depends on. Mass generation produces filler that falls apart the moment a recruiter opens a detail page. Thirty curated recipes is enough for every filter combination to return interesting subsets (5 per cuisine, overlapping diet tags) while every ingredient list and step sequence reads as real food.

**Consequences.** Authoring the dataset is real work, scheduled as its own chunk of M2. Zero network requests for data; recipe lookups are a module-scope `Map` by id. The `featuredRecipeIds` export pins the Home page to three known-good entries.

## D6 — Persistence: localStorage with namespaced keys, no cross-tab sync

**Context.** The plan board and calorie target must survive reloads and browser restarts (BRIEF success criterion #6) without accounts or a server. Stored data can be stale, hand-edited, or corrupt.

**Options considered.**
1. `localStorage` under project-prefixed keys, wrapped in a `useLocalStorage` hook (workspace convention).
2. IndexedDB via a wrapper (idb-keyval).
3. URL-encoded state (plan serialized into the query string).
4. Session-only React state.

**Decision.** Two namespaced keys — `nutriplan-plan` (week object, TECHNICAL-PLAN.md §4.3) and `nutriplan-target` (number, default 2000) — behind `useLocalStorage`, with lazy initialization, try/catch parse recovery that rewrites the default on corruption, and unresolvable recipe ids dropped on load. Cross-tab `storage`-event sync is deliberately omitted.

**Rationale.** The persisted payload is a 21-slot object of string ids and one number — kilobytes below any localStorage concern, making IndexedDB's async API pure ceremony. URL state would make links leak a user's whole week and balloon beyond practical length. Doing localStorage *properly* — namespacing, corrupt-data recovery, id revalidation — is itself portfolio goal #4. Cross-tab sync is real engineering effort for a scenario (two planner tabs open at once) no visitor of a portfolio demo will hit; last-write-wins is acceptable.

**Consequences.** Two tabs editing simultaneously can overwrite each other — accepted and documented. Every write path goes through `usePlan`/`useTarget`; no component touches `localStorage` directly. Clearing site data resets the app cleanly to the empty week + 2,000 kcal default.

## D7 — Macro visuals: hand-rolled SVG, no chart library

**Context.** The recipe detail page centers on a macro donut and three progress rings; the planner needs per-day progress bars. Chart libraries (Recharts, Chart.js) exist for exactly this.

**Options considered.**
1. Hand-built SVG components (`MacroDonut`, `MacroRing`) using stroke-dasharray math.
2. Recharts (already used elsewhere in the workspace by pulse-analytics).
3. Chart.js via react-chartjs-2.

**Decision.** Hand-rolled SVG. Donut = three stacked `motion.circle` elements with rotation offsets accumulating calorie shares; rings = single circles animating `strokeDashoffset`; both labeled `role="img"`.

**Rationale.** A three-segment donut and a fixed-max ring are ~40 lines of trigonometry-free SVG each; a chart library would spend tens of KB to draw them while fighting us on the exact palette, stroke caps, center label, and 900 ms mount animation the design specifies. Hand-rolled stroke-dash math is BRIEF portfolio goal #3 — the point is to show the skill, not to hide it behind a dependency. Recharts stays pulse-analytics' differentiator.

**Consequences.** We own the math: segment shares must be normalized so rounding never leaves a gap (verified for all 30 recipes in M3). Accessibility is manual — each SVG carries an `aria-label` and the values also render as visible text. No free tooltips or legends, none of which the design calls for.

## D8 — Theming: single light theme, no dark mode

**Context.** Several sibling portfolio projects ship theme toggles. NutriPlan's identity is a warm cream canvas under real food photography.

**Options considered.**
1. One light, food-forward theme.
2. Light/dark toggle persisted to localStorage.
3. Auto-follow `prefers-color-scheme` with no toggle.

**Decision.** Light only. `cream-50` page ground, white surfaces, the full single-column token table in DESIGN-SYSTEM.md §1. No toggle, no dark palette, no `dark:` variants.

**Rationale.** Food photography is the product's emotional core, and the warm daylight art direction (DESIGN-SYSTEM.md §6) collapses on a dark ground — appetizing becomes gloomy, and every photo would need a second edit pass to sit correctly. A dark palette would also double the audit surface of a 15-color system for zero narrative gain, since other portfolio projects already demonstrate theming. One confident theme is a design decision worth showing; a reluctant dark mode is not.

**Consequences.** Simpler tokens, simpler QA — every contrast pair is checked once. The BRIEF lists dark mode as explicitly out of scope and PRD §9 as a non-goal, so the omission reads as intent, not oversight. If ever revisited, photography re-grading is the real cost, not the CSS.

## D9 — Images: downloaded Unsplash/Pexels WebP in `src/assets/`

**Context.** Thirty-one photographs (30 recipes + home hero) dominate page weight and the LCP metric. Imagery must look like one cookbook (DESIGN-SYSTEM.md §6) and survive forever on a static host.

**Options considered.**
1. Download free stock (Unsplash/Pexels), convert to WebP, commit to `src/assets/` (workspace convention).
2. Hotlink Unsplash CDN URLs with size params.
3. AI-generated food imagery.

**Decision.** Curated free stock photos downloaded, cropped to 4:3, converted to WebP (recipes 1200×900 ≤ 180 KB, hero 1600×1200 ≤ 220 KB), committed to `src/assets/` and named by recipe id, statically imported so Vite hashes and optimizes them.

**Rationale.** Hotlinking hands LCP to a third-party host, breaks the moment a photo is delisted, and violates the workspace rule against hotlinked imagery. AI renders fail the "real food photography" art direction and read as filler to any recruiter who looks closely. Committing curated WebP keeps the deploy hermetic, lets `loading="lazy"` + explicit dimensions kill CLS, and makes the image-per-recipe contract (`image` field = imported asset) enforceable at build time.

**Consequences.** Sourcing and compressing 31 photos to one consistent style is scheduled work in M2. Repo grows by roughly 5–6 MB — acceptable for a portfolio repo. Recipe id doubles as filename, so renaming a recipe means renaming its asset.

## D10 — Deployment: Vercel static with SPA rewrite

**Context.** The finished app must be a public, shareable URL where deep links like `/recipes/:id` and `/planner` resolve directly (BRIEF success criteria run Lighthouse against the production URL).

**Options considered.**
1. Vercel static deploy of the Vite build (workspace convention).
2. Netlify (equivalent, `_redirects` file).
3. GitHub Pages (subpath hosting, awkward SPA fallback).

**Decision.** Vercel, building `vite build` output, with `vercel.json` containing the single rewrite `{"source": "/(.*)", "destination": "/index.html"}`.

**Rationale.** Every project in the workspace ships on Vercel, so one deployment story covers the whole portfolio. Git-push previews give a QA URL per branch for the M1–M8 milestones. GitHub Pages' subpath (`/nutriplan/`) would pollute router base config and OG URLs; Vercel serves from root. The rewrite is the entire backend footprint of the project — one line.

**Consequences.** `vercel.json` lives at repo root from M1 so deep-link behavior is verified from the first deploy. Custom 404 handling is client-side: unknown paths hit the `*` route and redirect to `/` (PRD §1), and unknown recipe ids render the in-app not-found state (PRD §5.6).

## D11 — Planner interaction: picker modal, not drag-and-drop

**Context.** Filling a Mon–Sun × 3-slot board needs an add mechanism. Drag-and-drop is the genre default for boards and was seriously considered.

**Options considered.**
1. Per-slot "+ Add meal" opening a focus-trapped `RecipePickerModal` with search.
2. Drag-and-drop from a recipe tray (dnd-kit).
3. Both — modal as the accessible fallback under drag-and-drop.

**Decision.** Picker modal only. Each empty slot is a button that opens `RecipePickerModal` scoped to that day + meal; selection commits, closes, and returns focus to the originating slot.

**Rationale.** Drag-and-drop is hostile on the primary small-screen layout (375 px stacked days — dragging across a scrolling page is miserable), demands heavy ARIA choreography to stay keyboard-accessible, and pulls in dnd-kit against the bundle budget for interaction polish the BRIEF doesn't claim. The modal flow is two taps, searchable, identical on every breakpoint, and showcases the focus-trap/focus-restore pattern that *is* a stated portfolio goal (#8). Building both (option 3) doubles the surface for a demo app.

**Consequences.** Recipes can't be moved between slots — remove then re-add, which the PRD accepts. Drag-and-drop is written into BRIEF scope-out and PRD non-goals so its absence reads as chosen. The shared `Modal` gets built once and reused by the mobile nav sheet's patterns.

## D12 — Calculator: Mifflin-St Jeor, metric only, explicit Calculate

**Context.** The calculator must turn body stats into a defensible daily kcal target and feed the planner. Multiple BMR equations and unit systems exist, and results could recompute live or on submit.

**Options considered.**
1. Mifflin-St Jeor, metric inputs (cm/kg), results on explicit **"Calculate"**.
2. Harris-Benedict (revised) equation.
3. Katch-McArdle (needs body-fat %) with imperial/metric toggle and live recompute.

**Decision.** Mifflin-St Jeor exactly as specified in PRD §7.2, metric-only inputs with hard validation ranges, computation only on **"Calculate"**, goal adjustment via the three presets (−500 / ±0 / +300), target rounded to the nearest 10.

**Rationale.** Mifflin-St Jeor is the modern standard the ADA recommends and needs only the four inputs the form already collects; Katch-McArdle's body-fat field would demand a number most users don't know, and Harris-Benedict is simply the older, less accurate choice. A unit toggle doubles validation and copy surface for no demonstrated skill the form doesn't already show. Explicit submit makes the count-up animation a meaningful moment and keeps half-edited forms from flashing garbage results — PRD §7's "no live recompute" criterion.

**Consequences.** The worked example (F/30/165/60/moderate → BMR 1,320, TDEE 2,046) is a permanent regression fixture in M5. Imperial users must convert first — documented as out of scope in the BRIEF. The formula lives in `lib/calculations.js` as pure functions, unit-testable without React.
