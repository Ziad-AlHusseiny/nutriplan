import { describe, expect, it } from 'vitest';
import { recipeById, recipes } from '../data/recipes.js';
import { candidatesFor, fillWeek, MAX_REPEATS } from './autoplan.js';
import { emptyWeek } from './plan.js';
import { DAYS, SLOTS } from './week.js';

const resolve = (id) => recipeById.get(id) ?? null;
const run = (opts) => fillWeek({ week: emptyWeek(), recipes, resolve, targets: { kcal: 2000, protein: 100 }, ...opts });
const usesOf = (week) => {
  const uses = {};
  for (const d of DAYS) for (const s of SLOTS) if (week[d][s]) uses[week[d][s].id] = (uses[week[d][s].id] ?? 0) + 1;
  return uses;
};

describe('Fill my week', () => {
  it('is deterministic: the same inputs give the same plan', () => {
    expect(run().week).toEqual(run().week);
    expect(run({ diets: ['vegetarian'], targets: { kcal: 1800, protein: 90 } }).week).toEqual(run({ diets: ['vegetarian'], targets: { kcal: 1800, protein: 90 } }).week);
  });

  it('lands every day within ±5% of common targets', () => {
    for (const kcal of [1500, 1800, 2000, 2400, 3000]) {
      const r = run({ targets: { kcal, protein: kcal / 20 } });
      for (const d of r.days) expect(Math.abs(d.kcal - kcal) / kcal, `${kcal} ${d.day}`).toBeLessThanOrEqual(0.05);
    }
  });

  it('lands on or under the target (over turns a day red), for common targets', () => {
    for (const kcal of [1200, 1500, 2000, 2500, 3000]) {
      for (const d of run({ targets: { kcal, protein: kcal / 20 } }).days) expect(d.kcal, `${kcal} ${d.day}`).toBeLessThanOrEqual(kcal);
    }
  });

  it('low targets: half portions and empty slots, never over the ceiling', () => {
    for (const diets of [[], ['vegetarian'], ['vegan']]) {
      const r = run({ targets: { kcal: 1200, protein: 60 }, diets });
      for (const d of r.days) expect(d.kcal, `${diets} ${d.day}`).toBeLessThanOrEqual(1200 * 1.05);
    }
    const week = emptyWeek();
    week.monday.lunch = { id: 'chicken-shawarma-plate', servings: 2 }; // 1,220 kcal
    const r = fillWeek({ week, recipes, resolve, targets: { kcal: 1500 }, days: ['monday'] });
    expect(r.days[0].kcal).toBeLessThanOrEqual(1500 * 1.05);
    expect(r.unfilled.some((u) => u.reason === 'day-full')).toBe(true);
  });

  it('never repeats a recipe more than twice a week, or twice in a day', () => {
    const r = run();
    expect(Math.max(...Object.values(usesOf(r.week)))).toBeLessThanOrEqual(MAX_REPEATS);
    for (const d of DAYS) {
      const ids = SLOTS.map((s) => r.week[d][s]?.id).filter(Boolean);
      expect(new Set(ids).size).toBe(ids.length);
    }
    expect(r.relaxed).toEqual([]);
  });

  it('respects diets: every pick passes every chosen restriction', () => {
    for (const diets of [['vegan'], ['vegetarian'], ['keto'], ['vegetarian', 'keto']]) {
      const r = run({ diets });
      for (const f of r.filled) for (const d of diets) expect(recipeById.get(f.id).diets, f.id).toContain(d);
    }
  });

  it('only uses recipes that suit the slot', () => {
    const r = run();
    for (const f of r.filled) expect(recipeById.get(f.id).meals, `${f.id} in ${f.slot}`).toContain(f.slot);
  });

  it('never touches filled slots and counts them toward the day', () => {
    const week = emptyWeek();
    week.monday.dinner = { id: 'custom:koshari', servings: 1 };
    week.tuesday.lunch = { id: 'shakshuka', servings: 2 };
    const r = fillWeek({ week, recipes, resolve: (id) => (id === 'custom:koshari' ? { kcal: 900, protein: 25 } : resolve(id)), targets: { kcal: 2000 } });
    expect(r.week.monday.dinner).toEqual({ id: 'custom:koshari', servings: 1 });
    expect(r.week.tuesday.lunch).toEqual({ id: 'shakshuka', servings: 2 });
    expect(r.filled.some((f) => f.day === 'monday' && f.slot === 'dinner')).toBe(false);
    expect(Math.abs(r.days.find((d) => d.day === 'monday').kcal - 2000)).toBeLessThanOrEqual(100);
    expect(week.monday.lunch).toBeNull(); // input not mutated
  });

  it('leaves a full day alone and explains why', () => {
    const week = emptyWeek();
    week.friday.lunch = { id: 'chicken-shawarma-plate', servings: 4 }; // 2,440 kcal
    const r = fillWeek({ week, recipes, resolve, targets: { kcal: 2000 } });
    expect(r.unfilled.filter((u) => u.day === 'friday').every((u) => u.reason === 'day-full')).toBe(true);
  });

  it('fills only the chosen days and slots', () => {
    const r = run({ days: ['saturday', 'sunday'], slots: ['lunch', 'dinner'] });
    expect(r.filled.every((f) => ['saturday', 'sunday'].includes(f.day) && ['lunch', 'dinner'].includes(f.slot))).toBe(true);
    expect(r.filled).toHaveLength(4);
  });

  it('says so when a narrow diet forces repeats (keto breakfasts)', () => {
    expect(candidatesFor('breakfast', recipes, ['keto']).map((r) => r.id)).toEqual(['spinach-egg-muffins']);
    const r = run({ diets: ['keto'] });
    expect(r.relaxed).toContain('breakfast');
    expect(r.filled.filter((f) => f.slot === 'breakfast')).toHaveLength(7);
  });

  it('prefers protein when high-protein is chosen', () => {
    const protein = (res) => res.filled.reduce((acc, f) => acc + recipeById.get(f.id).protein * f.servings, 0);
    expect(protein(run({ diets: ['high-protein'], targets: { kcal: 2000, protein: 150 } }))).toBeGreaterThan(protein(run({ targets: { kcal: 2000, protein: 0 } })));
  });

  it('explains each pick with the slot’s aim', () => {
    const r = run();
    expect(r.filled).toHaveLength(28);
    for (const f of r.filled) {
      expect(f.aim).toBeGreaterThan(0);
      expect(f.kcal).toBe(recipeById.get(f.id).kcal * f.servings);
    }
  });
});
