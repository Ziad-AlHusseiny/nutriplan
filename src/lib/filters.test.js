import { describe, expect, it } from 'vitest';
import { CUISINES, DIETS, MEALS, recipes } from '../data/recipes.js';
import { activeFilterCount, DEFAULT_FILTERS, filterRecipes, KCAL, TIME } from './filters.js';

// Every subset of a list (the power set).
const subsets = (list) => list.reduce((acc, x) => acc.concat(acc.map((s) => [...s, x])), [[]]);
const range = ({ min, max, step }) => Array.from({ length: (max - min) / step + 1 }, (_, i) => min + i * step);

/** The PRD §4.2 rule, written independently: AND across groups, OR within. */
function expected(f, favorites = []) {
  return recipes.filter((r) => {
    if (f.cuisines.length && !f.cuisines.includes(r.cuisine)) return false;
    if (f.diets.length && !r.diets.some((d) => f.diets.includes(d))) return false;
    if (f.meals.length && !r.meals.some((m) => f.meals.includes(m))) return false;
    if (f.maxKcal < 800 && r.kcal > f.maxKcal) return false;
    if (f.maxTime < 60 && r.prepTime > f.maxTime) return false;
    if (f.favoritesOnly && !favorites.includes(r.id)) return false;
    return true;
  });
}

const ids = (list) => list.map((r) => r.id);

describe('filterRecipes (BRIEF criterion 5)', () => {
  it('returns all 30 with default filters', () => {
    expect(filterRecipes(recipes, DEFAULT_FILTERS)).toHaveLength(30);
  });

  it('every combination of chips and sliders returns exactly the matching subset', () => {
    const cuisineSets = subsets(CUISINES); // 64
    const dietSets = subsets(DIETS); // 16
    const mealSets = [[], ['breakfast'], ['snacks'], ['lunch', 'dinner'], MEALS];
    const kcals = range(KCAL); // 13
    const times = range(TIME); // 11
    let checked = 0;
    for (const cuisines of cuisineSets)
      for (const diets of dietSets)
        for (const meals of mealSets)
          for (const maxKcal of kcals)
            for (const maxTime of times) {
              const f = { ...DEFAULT_FILTERS, cuisines, diets, meals, maxKcal, maxTime };
              const got = filterRecipes(recipes, f);
              const want = expected(f);
              if (got.length !== want.length || ids(got).join() !== ids(want).join()) {
                throw new Error(`Mismatch for ${JSON.stringify(f)}`);
              }
              checked += 1;
            }
    expect(checked).toBe(64 * 16 * 5 * 13 * 11);
  });

  it('PRD examples: Vegan, Vegan+Keto (OR), Asian+Vegan (AND), 500 kcal cap', () => {
    const vegan = filterRecipes(recipes, { diets: ['vegan'] });
    expect(vegan.length).toBeGreaterThan(0);
    expect(vegan.every((r) => r.diets.includes('vegan'))).toBe(true);

    const veganOrKeto = filterRecipes(recipes, { diets: ['vegan', 'keto'] });
    expect(veganOrKeto.every((r) => r.diets.includes('vegan') || r.diets.includes('keto'))).toBe(true);
    expect(veganOrKeto.length).toBeGreaterThan(vegan.length);

    const asianVegan = filterRecipes(recipes, { cuisines: ['asian'], diets: ['vegan'] });
    expect(asianVegan.length).toBeGreaterThan(0);
    expect(asianVegan.every((r) => r.cuisine === 'asian' && r.diets.includes('vegan'))).toBe(true);

    expect(filterRecipes(recipes, { maxKcal: 500 }).every((r) => r.kcal <= 500)).toBe(true);
  });

  it('search matches title or ingredient names, case-insensitively', () => {
    const textOf = (r) => [r.title, ...r.ingredients.map((i) => i.item.replace(/-/g, ' '))].join(' ');
    const chicken = filterRecipes(recipes, { query: 'CHICKEN' }, { textOf });
    expect(chicken.length).toBeGreaterThan(0);
    expect(chicken.every((r) => /chicken/i.test(textOf(r)))).toBe(true);
    expect(ids(filterRecipes(recipes, { query: 'shakshuka' }, { textOf }))).toEqual(['shakshuka']);
    expect(filterRecipes(recipes, { query: 'zzz' }, { textOf })).toHaveLength(0);
  });

  it('favorites narrow to saved recipes', () => {
    const favorites = ['shakshuka', 'turkey-chili'];
    const f = { ...DEFAULT_FILTERS, favoritesOnly: true };
    expect(ids(filterRecipes(recipes, f, { favorites }))).toEqual(ids(expected(f, favorites)));
  });

  it('counts active filters for the mobile badge', () => {
    expect(activeFilterCount(DEFAULT_FILTERS)).toBe(0);
    expect(activeFilterCount({ cuisines: ['asian'], diets: ['vegan', 'keto'], maxKcal: 500 })).toBe(4);
    expect(activeFilterCount({ query: '  ' })).toBe(0);
  });
});
