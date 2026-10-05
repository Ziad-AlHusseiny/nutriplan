import { describe, expect, it } from 'vitest';
import { recipeById } from '../data/recipes.js';
import { clampServings, clearDay, copyDay, copyWeek, dayTotals, emptyWeek, entriesOf, getWeek, moveEntry, removeIdEverywhere, setEntry, setServings, validatePlan, weekSummary } from './plan.js';
import { addWeeks, mondayOf, weekKeyOf } from './week.js';

const knownRecipe = (id) => recipeById.has(id);
const resolve = (id) => recipeById.get(id) ?? (id === 'custom:koshari' ? { kcal: 700, protein: 20, carbs: 120, fat: 15 } : null);
const W = '2026-10-05';
let plan = { version: 2, weeks: {} };

describe('plan operations', () => {
  it('adds, scales, moves, swaps and removes meals', () => {
    plan = setEntry(plan, W, 'monday', 'breakfast', { id: 'overnight-berry-oats' });
    plan = setEntry(plan, W, 'monday', 'lunch', { id: 'grilled-lemon-chicken-bowl', servings: 1.5 });
    expect(getWeek(plan, W).monday.breakfast).toEqual({ id: 'overnight-berry-oats', servings: 1 });
    expect(dayTotals(getWeek(plan, W).monday, resolve).kcal).toBe(380 + 520 * 1.5);

    plan = setServings(plan, W, 'monday', 'lunch', 2);
    expect(getWeek(plan, W).monday.lunch.servings).toBe(2);

    plan = moveEntry(plan, W, { day: 'monday', slot: 'lunch' }, { day: 'tuesday', slot: 'dinner' });
    expect(getWeek(plan, W).monday.lunch).toBeNull();
    expect(getWeek(plan, W).tuesday.dinner.id).toBe('grilled-lemon-chicken-bowl');

    plan = moveEntry(plan, W, { day: 'tuesday', slot: 'dinner' }, { day: 'monday', slot: 'breakfast' });
    expect(getWeek(plan, W).monday.breakfast.id).toBe('grilled-lemon-chicken-bowl');
    expect(getWeek(plan, W).tuesday.dinner.id).toBe('overnight-berry-oats');
  });

  it('clear day leaves other days untouched (PRD §6)', () => {
    plan = setEntry(plan, W, 'monday', 'dinner', { id: 'shakshuka' });
    const cleared = clearDay(plan, W, 'monday');
    expect(dayTotals(getWeek(cleared, W).monday, resolve).kcal).toBe(0);
    expect(getWeek(cleared, W).tuesday.dinner.id).toBe('overnight-berry-oats');
  });

  it('copies a day and repeats a week into empty slots only', () => {
    const copied = copyDay(plan, W, 'monday', ['wednesday', 'thursday']);
    expect(getWeek(copied, W).wednesday).toEqual(getWeek(copied, W).monday);
    const next = addWeeks(W, 1);
    let p = setEntry(copied, next, 'monday', 'breakfast', { id: 'ful-medames' });
    const { plan: repeated, copied: n } = copyWeek(p, W, next);
    expect(getWeek(repeated, next).monday.breakfast.id).toBe('ful-medames');
    expect(getWeek(repeated, next).monday.dinner.id).toBe('shakshuka');
    expect(n).toBe(entriesOf(getWeek(copied, W)).length - 1);
  });

  it('allows the same recipe in several slots (PRD §6)', () => {
    let p = setEntry({ version: 2, weeks: {} }, W, 'monday', 'lunch', { id: 'shakshuka' });
    p = setEntry(p, W, 'friday', 'dinner', { id: 'shakshuka' });
    expect(entriesOf(getWeek(p, W))).toHaveLength(2);
  });

  it('clamps servings to ½–4 in halves', () => {
    expect(clampServings(0)).toBe(0.5);
    expect(clampServings(1.3)).toBe(1.5);
    expect(clampServings(9)).toBe(4);
    expect(clampServings('x')).toBe(1);
  });

  it('removes a deleted custom meal from every week', () => {
    let p = setEntry({ version: 2, weeks: {} }, W, 'monday', 'dinner', { id: 'custom:koshari' });
    p = setEntry(p, addWeeks(W, 1), 'friday', 'lunch', { id: 'custom:koshari' });
    expect(Object.keys(removeIdEverywhere(p, 'custom:koshari').weeks)).toHaveLength(0);
  });
});

describe('validatePlan (persistence and corrupt data)', () => {
  it('drops unknown recipe ids, keeps custom meals, cleans servings', () => {
    const raw = { version: 2, weeks: { [W]: { monday: { breakfast: { id: 'nope' }, lunch: { id: 'shakshuka', servings: 7 }, dinner: { id: 'custom:koshari', servings: 1 } } } } };
    const p = validatePlan(raw, { knownRecipe });
    expect(p.weeks[W].monday).toEqual({ breakfast: null, lunch: { id: 'shakshuka', servings: 4 }, dinner: { id: 'custom:koshari', servings: 1 }, snacks: null });
  });

  it('migrates the docs’ single-week shape into the current week', () => {
    const now = new Date(2026, 9, 8);
    const legacy = { monday: { breakfast: 'overnight-berry-oats', lunch: null, dinner: 'grilled-lemon-chicken-bowl' }, tuesday: { breakfast: 'gone', lunch: null, dinner: null } };
    const p = validatePlan(legacy, { knownRecipe, now });
    expect(Object.keys(p.weeks)).toEqual([weekKeyOf(now)]);
    expect(p.weeks[weekKeyOf(now)].monday.dinner).toEqual({ id: 'grilled-lemon-chicken-bowl', servings: 1 });
    expect(p.weeks[weekKeyOf(now)].tuesday.breakfast).toBeNull();
  });

  it('rejects junk (the store then resets to an empty plan)', () => {
    expect(validatePlan(null, { knownRecipe })).toBeUndefined();
    expect(validatePlan([1, 2], { knownRecipe })).toBeUndefined();
    expect(validatePlan({ weeks: 'x' }, { knownRecipe })).toBeUndefined();
    expect(validatePlan({ weeks: { 'not-a-date': {}, '2026-10-06': {} } }, { knownRecipe }).weeks).toEqual({});
  });
});

describe('weeks', () => {
  it('weeks start on Monday', () => {
    expect(weekKeyOf(new Date(2026, 9, 5))).toBe('2026-10-05');
    expect(weekKeyOf(new Date(2026, 9, 11))).toBe('2026-10-05');
    expect(weekKeyOf(new Date(2026, 9, 12))).toBe('2026-10-12');
    expect(mondayOf(new Date(2027, 0, 1)).getDay()).toBe(1);
    expect(addWeeks('2026-12-28', 1)).toBe('2027-01-04');
  });
});

describe('per-day aggregation', () => {
  it('sums kcal and macros × servings, skipping ids that no longer resolve', () => {
    const day = { breakfast: { id: 'shakshuka', servings: 2 }, lunch: { id: 'custom:koshari', servings: 1 }, dinner: { id: 'custom:gone', servings: 1 }, snacks: null };
    const t = dayTotals(day, resolve);
    expect(t).toEqual({ kcal: 330 * 2 + 700, protein: 18 * 2 + 20, carbs: 20 * 2 + 120, fat: 20 * 2 + 15, meals: 2 });
  });

  it('week summary averages planned days and counts days on target', () => {
    const week = emptyWeek();
    week.monday.lunch = { id: 'grilled-lemon-chicken-bowl', servings: 4 }; // 2,080
    week.tuesday.lunch = { id: 'grilled-lemon-chicken-bowl', servings: 2 }; // 1,040
    const s = weekSummary(week, resolve, { kcal: 2000 });
    expect(s.plannedDays).toBe(2);
    expect(s.average.kcal).toBe(1560);
    expect(s.onTarget).toBe(1);
    expect(s.meals).toBe(2);
  });
});
