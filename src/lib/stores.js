// Every saved value, with its validator. The docs' two keys (`plan`,
// `target`) plus the ones the real tools need (BUILD-LOG lists them), all
// under `nutriplan-`. Validators clean anything hand-edited or stale, so a
// bad value can never blank a page.

import { RECIPE_IDS } from '../data/recipeIds.js';
import { emptyPlan, validatePlan } from './plan.js';
import { createStore } from './storage.js';
import { isWeekKey, SLOTS } from './week.js';

const oneOf = (values) => (v) => (values.includes(v) ? v : undefined);
const isObject = (v) => v != null && typeof v === 'object' && !Array.isArray(v);
const finite = (v, min, max) => Number.isFinite(v) && v >= min && v <= max;

export const knownRecipe = (id) => RECIPE_IDS.has(id);

export const planStore = createStore('plan', emptyPlan(), (v) => validatePlan(v, { knownRecipe }));

/** Daily kcal target (the docs' `nutriplan-target`, a number; default 2,000). */
export const DEFAULT_TARGET = 2000;
/**
 * What a saved target may be: wide enough for every result the calculator
 * can give (a 35 kg 90-year-old at rest, a 250 kg athlete gaining), so a
 * saved value never silently reverts. Typed-in targets use TARGET_INPUT.
 */
export const TARGET_RANGE = [500, 8000];
export const TARGET_INPUT = [1200, 8000];
export const MACRO_MAX = { protein: 600, carbs: 1200, fat: 400 };
export const targetStore = createStore('target', DEFAULT_TARGET, (v) => (finite(v, ...TARGET_RANGE) ? Math.round(v) : undefined));

/** Daily macro targets in grams, or null to derive them from the kcal target. */
export function validMacros(v) {
  if (v === null) return null;
  if (!isObject(v)) return undefined;
  const ok = finite(v.protein, 0, MACRO_MAX.protein) && finite(v.carbs, 0, MACRO_MAX.carbs) && finite(v.fat, 0, MACRO_MAX.fat);
  return ok ? { protein: Math.round(v.protein), carbs: Math.round(v.carbs), fat: Math.round(v.fat) } : undefined;
}
export const macrosStore = createStore('macros', null, validMacros);

/** Your own meals: { id, name, kcal, protein, carbs, fat }. */
export function validMeal(m) {
  return (
    isObject(m) &&
    typeof m.id === 'string' &&
    /^[\w-]{1,40}$/.test(m.id) &&
    typeof m.name === 'string' &&
    m.name.trim().length > 0 &&
    m.name.length <= 80 &&
    finite(m.kcal, 1, 5000) &&
    ['protein', 'carbs', 'fat'].every((k) => m[k] == null || finite(m[k], 0, 1000))
  );
}
const listOf = (valid, max) => (v) => (Array.isArray(v) ? v.filter(valid).slice(0, max) : undefined);
export const mealsStore = createStore('meals', [], listOf(validMeal, 200));

export const favoritesStore = createStore('favorites', [], (v) => (Array.isArray(v) ? [...new Set(v.filter(knownRecipe))] : undefined));

/** Shopping list state per week: checked rows and your own extra items. */
export function validShopping(v) {
  if (!isObject(v) || !isObject(v.weeks)) return undefined;
  const weeks = {};
  const keys = Object.keys(v.weeks).filter(isWeekKey).sort().slice(-12);
  for (const key of keys) {
    const w = v.weeks[key];
    if (!isObject(w)) continue;
    weeks[key] = {
      checked: Array.isArray(w.checked) ? [...new Set(w.checked.filter((k) => typeof k === 'string' && k.length <= 60))] : [],
      extras: Array.isArray(w.extras)
        ? w.extras
            .filter((e) => isObject(e) && typeof e.id === 'string' && typeof e.text === 'string' && e.text.trim() && e.text.length <= 120)
            .map((e) => ({ id: e.id, text: e.text, checked: e.checked === true }))
            .slice(0, 100)
        : [],
      days: Array.isArray(w.days) ? w.days.filter((d) => typeof d === 'string').slice(0, 7) : undefined,
    };
    if (!weeks[key].days) delete weeks[key].days;
  }
  return { weeks };
}
export const shoppingStore = createStore('shopping', { weeks: {} }, validShopping);

/** Staples most kitchens already have: the list starts them under "Already have". */
export const DEFAULT_PANTRY = ['salt', 'black-pepper', 'olive-oil'];

/** Items you always have at home ("Already have"). */
export const pantryStore = createStore('pantry', DEFAULT_PANTRY, (v) => (Array.isArray(v) ? [...new Set(v.filter((k) => typeof k === 'string' && /^[a-z-]{1,40}$/.test(k)))] : undefined));

export const unitsStore = createStore('units', 'metric', oneOf(['metric', 'us']));
export const localeStore = createStore('locale', null, oneOf(['en', 'ar']));
export const themeStore = createStore('theme', null, oneOf(['light', 'dark']));

/** The calculator's last inputs, so they're there next time. */
export function validProfile(v) {
  if (!isObject(v)) return undefined;
  const out = {};
  if (v.sex === 'female' || v.sex === 'male') out.sex = v.sex;
  if (finite(v.age, 15, 90)) out.age = v.age;
  if (finite(v.heightCm, 120, 230)) out.heightCm = v.heightCm;
  if (finite(v.weightKg, 35, 250)) out.weightKg = v.weightKg;
  if (['sedentary', 'light', 'moderate', 'very', 'athlete'].includes(v.activity)) out.activity = v.activity;
  if (['lose', 'lose-slow', 'maintain', 'gain'].includes(v.goal)) out.goal = v.goal;
  return out;
}
export const profileStore = createStore('profile', null, (v) => (v === null ? null : validProfile(v)));

/** "Fill my week" choices, remembered. */
export const autoplanStore = createStore('autoplan', { diets: [], slots: SLOTS }, (v) => {
  if (!isObject(v)) return undefined;
  const diets = Array.isArray(v.diets) ? v.diets.filter((d) => ['vegan', 'vegetarian', 'keto', 'high-protein'].includes(d)) : [];
  const slots = Array.isArray(v.slots) ? SLOTS.filter((s) => v.slots.includes(s)) : SLOTS;
  return { diets, slots: slots.length ? slots : SLOTS };
});
