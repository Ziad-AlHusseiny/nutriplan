// The meal plan (stored under the docs' key, `nutriplan-plan`). The docs'
// shape was one undated week of recipe ids (TECHNICAL-PLAN §4.3); the build
// keeps real calendar weeks so "repeat last week" and next-week planning
// work, adds a snacks slot and servings per slot (BUILD-LOG):
//
//   { version: 2, weeks: { "2026-10-05": { monday: { breakfast: { id, servings }, lunch: null, dinner: …, snacks: … }, … } } }
//
// `id` is a recipe id or "custom:<id>" for your own meals. A stored week in
// the docs' old shape is migrated into the current week on load.

import { DAYS, SLOTS, isWeekKey, weekKeyOf } from './week.js';

export const PLAN_VERSION = 2;
export const SERVINGS = { min: 0.5, max: 4, step: 0.5 };
/** Weeks kept (the newest); older ones are dropped. */
export const MAX_WEEKS = 26;

export const emptyDay = () => ({ breakfast: null, lunch: null, dinner: null, snacks: null });
export const emptyWeek = () => Object.fromEntries(DAYS.map((d) => [d, emptyDay()]));
export const emptyPlan = () => ({ version: PLAN_VERSION, weeks: {} });

export const isCustomId = (id) => typeof id === 'string' && /^custom:[\w-]{1,40}$/.test(id);

export function clampServings(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 1;
  const stepped = Math.round(v / SERVINGS.step) * SERVINGS.step;
  return Math.min(SERVINGS.max, Math.max(SERVINGS.min, stepped));
}

const isObject = (v) => v != null && typeof v === 'object' && !Array.isArray(v);

/** A slot value from storage, cleaned; null when empty or unresolvable. */
function cleanEntry(value, knownRecipe) {
  if (value == null) return null;
  const id = typeof value === 'string' ? value : isObject(value) ? value.id : null;
  if (typeof id !== 'string') return null;
  if (!knownRecipe(id) && !isCustomId(id)) return null;
  const servings = typeof value === 'string' ? 1 : clampServings(value.servings ?? 1);
  return { id, servings };
}

function cleanWeek(raw, knownRecipe) {
  const week = emptyWeek();
  if (!isObject(raw)) return week;
  for (const day of DAYS) {
    if (!isObject(raw[day])) continue;
    for (const slot of SLOTS) week[day][slot] = cleanEntry(raw[day][slot], knownRecipe);
  }
  return week;
}

export const weekHasMeals = (week) => DAYS.some((d) => SLOTS.some((s) => week?.[d]?.[s]));

/** The docs' original shape: monday…sunday of breakfast/lunch/dinner ids. */
const isLegacyWeek = (raw) => isObject(raw) && !('weeks' in raw) && DAYS.some((d) => isObject(raw[d]));

/**
 * Validates a stored plan. Unknown recipe ids are dropped (PRD §4.3), a
 * legacy single week moves into the current week, and anything unreadable
 * returns undefined (the store then resets to an empty plan).
 */
export function validatePlan(raw, { knownRecipe, now = new Date() }) {
  if (isLegacyWeek(raw)) {
    const week = cleanWeek(raw, knownRecipe);
    return prune({ version: PLAN_VERSION, weeks: weekHasMeals(week) ? { [weekKeyOf(now)]: week } : {} });
  }
  if (!isObject(raw) || !isObject(raw.weeks)) return undefined;
  const weeks = {};
  for (const [key, value] of Object.entries(raw.weeks)) {
    if (!isWeekKey(key)) continue;
    const week = cleanWeek(value, knownRecipe);
    if (weekHasMeals(week)) weeks[key] = week;
  }
  return prune({ version: PLAN_VERSION, weeks });
}

/** Drops empty weeks and keeps the newest MAX_WEEKS. */
export function prune(plan) {
  const keys = Object.keys(plan.weeks)
    .filter((k) => weekHasMeals(plan.weeks[k]))
    .sort()
    .slice(-MAX_WEEKS);
  return { version: PLAN_VERSION, weeks: Object.fromEntries(keys.map((k) => [k, plan.weeks[k]])) };
}

export const getWeek = (plan, key) => plan.weeks[key] ?? emptyWeek();

function withWeek(plan, key, update) {
  const week = structuredClone(getWeek(plan, key));
  update(week);
  return prune({ ...plan, weeks: { ...plan.weeks, [key]: week } });
}

export const setEntry = (plan, key, day, slot, entry) =>
  withWeek(plan, key, (w) => {
    w[day][slot] = entry ? { id: entry.id, servings: clampServings(entry.servings ?? 1) } : null;
  });

export const removeEntry = (plan, key, day, slot) => setEntry(plan, key, day, slot, null);

export const setServings = (plan, key, day, slot, servings) =>
  withWeek(plan, key, (w) => {
    if (w[day][slot]) w[day][slot].servings = clampServings(servings);
  });

/** Moves a meal to another slot; if that slot is taken, the two swap. */
export const moveEntry = (plan, key, from, to) =>
  withWeek(plan, key, (w) => {
    const a = w[from.day][from.slot];
    w[from.day][from.slot] = w[to.day][to.slot];
    w[to.day][to.slot] = a;
  });

/** Copies one day's meals onto other days (replacing what was there). */
export const copyDay = (plan, key, fromDay, toDays) =>
  withWeek(plan, key, (w) => {
    for (const day of toDays) if (day !== fromDay) w[day] = structuredClone(w[fromDay]);
  });

export const clearDay = (plan, key, day) =>
  withWeek(plan, key, (w) => {
    w[day] = emptyDay();
  });

export const clearWeek = (plan, key) => {
  const weeks = { ...plan.weeks };
  delete weeks[key];
  return { version: PLAN_VERSION, weeks };
};

/**
 * Copies a week into another one. With onlyEmpty (the default), filled
 * slots in the target are left alone. Returns { plan, copied }.
 */
export function copyWeek(plan, fromKey, toKey, { onlyEmpty = true } = {}) {
  const source = getWeek(plan, fromKey);
  let copied = 0;
  const next = withWeek(plan, toKey, (w) => {
    for (const day of DAYS) {
      for (const slot of SLOTS) {
        if (!source[day][slot] || (onlyEmpty && w[day][slot])) continue;
        w[day][slot] = { ...source[day][slot] };
        copied += 1;
      }
    }
  });
  return { plan: next, copied };
}

/** Replaces a whole week (undo, auto-planner). */
export const replaceWeek = (plan, key, week) => prune({ ...plan, weeks: { ...plan.weeks, [key]: structuredClone(week) } });

/** Every entry of a week as { day, slot, entry }. */
export function entriesOf(week) {
  const out = [];
  for (const day of DAYS) for (const slot of SLOTS) if (week[day][slot]) out.push({ day, slot, entry: week[day][slot] });
  return out;
}

/** Removes every use of an id (a deleted custom meal) from all weeks. */
export function removeIdEverywhere(plan, id) {
  const weeks = {};
  for (const [key, week] of Object.entries(plan.weeks)) {
    const w = structuredClone(week);
    for (const day of DAYS) for (const slot of SLOTS) if (w[day][slot]?.id === id) w[day][slot] = null;
    weeks[key] = w;
  }
  return prune({ version: PLAN_VERSION, weeks });
}

// ── Totals ──────────────────────────────────────────────────────────────

const ZERO = Object.freeze({ kcal: 0, protein: 0, carbs: 0, fat: 0 });

/**
 * A planned meal's nutrition: the recipe's (or custom meal's) per-serving
 * values × servings. `resolve(id)` returns { kcal, protein, carbs, fat } or
 * null for an id that no longer exists (it then counts as nothing).
 */
export function entryNutrition(entry, resolve) {
  const food = entry ? resolve(entry.id) : null;
  if (!food) return { ...ZERO };
  const n = entry.servings ?? 1;
  return {
    kcal: (food.kcal ?? 0) * n,
    protein: (food.protein ?? 0) * n,
    carbs: (food.carbs ?? 0) * n,
    fat: (food.fat ?? 0) * n,
  };
}

/** A day's totals (PRD §6.2: the sum of its filled slots). */
export function dayTotals(day, resolve) {
  const total = { ...ZERO, meals: 0 };
  for (const slot of SLOTS) {
    const entry = day?.[slot];
    if (!entry || !resolve(entry.id)) continue;
    const n = entryNutrition(entry, resolve);
    total.kcal += n.kcal;
    total.protein += n.protein;
    total.carbs += n.carbs;
    total.fat += n.fat;
    total.meals += 1;
  }
  return total;
}

/**
 * The week at a glance: per-day totals, the average over planned days, and
 * how many planned days land within ±tolerance of the kcal target.
 */
export function weekSummary(week, resolve, { kcal: target, tolerance = 0.1 } = {}) {
  const days = DAYS.map((d) => dayTotals(week[d], resolve));
  const planned = days.filter((d) => d.meals > 0);
  const sum = planned.reduce((acc, d) => ({ kcal: acc.kcal + d.kcal, protein: acc.protein + d.protein, carbs: acc.carbs + d.carbs, fat: acc.fat + d.fat }), { ...ZERO });
  const n = planned.length || 1;
  return {
    days,
    plannedDays: planned.length,
    meals: planned.reduce((acc, d) => acc + d.meals, 0),
    total: sum,
    average: { kcal: sum.kcal / n, protein: sum.protein / n, carbs: sum.carbs / n, fat: sum.fat / n },
    onTarget: target ? planned.filter((d) => Math.abs(d.kcal - target) <= target * tolerance).length : 0,
  };
}
