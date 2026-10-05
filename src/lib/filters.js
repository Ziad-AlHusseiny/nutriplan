// Recipe filtering (PRD §4.2): search AND cuisine AND diet AND kcal cap AND
// time cap, with chips OR-ed inside their group. Two groups the build adds
// (BUILD-LOG): Meal (breakfast / lunch & dinner / snacks) and Favorites.

import { matchesQuery } from './search.js';

export const KCAL = { min: 200, max: 800, step: 50 };
export const TIME = { min: 10, max: 60, step: 5 };

export const DEFAULT_FILTERS = Object.freeze({
  query: '',
  cuisines: [],
  diets: [],
  meals: [],
  maxKcal: KCAL.max,
  maxTime: TIME.max,
  favoritesOnly: false,
});

/** At the top of its range a slider means "Any" (no cap). */
export const kcalCap = (value) => (value >= KCAL.max ? Infinity : value);
export const timeCap = (value) => (value >= TIME.max ? Infinity : value);

/**
 * The searchable text of a recipe: its title in both languages and every
 * ingredient name. `textOf(recipe)` supplies it (so tests can stay pure).
 */
export function filterRecipes(list, filters, { textOf, favorites = [] } = {}) {
  const f = { ...DEFAULT_FILTERS, ...filters };
  const favs = new Set(favorites);
  const maxKcal = kcalCap(f.maxKcal);
  const maxTime = timeCap(f.maxTime);
  return list.filter(
    (r) =>
      (f.cuisines.length === 0 || f.cuisines.includes(r.cuisine)) &&
      (f.diets.length === 0 || f.diets.some((d) => r.diets.includes(d))) &&
      (f.meals.length === 0 || f.meals.some((m) => r.meals.includes(m))) &&
      r.kcal <= maxKcal &&
      r.prepTime <= maxTime &&
      (!f.favoritesOnly || favs.has(r.id)) &&
      (!f.query.trim() || matchesQuery(textOf ? textOf(r) : r.title, f.query)),
  );
}

/** How many filters differ from the defaults (the "Filters · 3" badge). */
export function activeFilterCount(filters) {
  const f = { ...DEFAULT_FILTERS, ...filters };
  return (
    f.cuisines.length +
    f.diets.length +
    f.meals.length +
    (f.maxKcal < KCAL.max ? 1 : 0) +
    (f.maxTime < TIME.max ? 1 : 0) +
    (f.favoritesOnly ? 1 : 0) +
    (f.query.trim() ? 1 : 0)
  );
}

export const toggleIn = (list, value) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
