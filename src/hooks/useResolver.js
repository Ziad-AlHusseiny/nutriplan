import { useMemo } from 'react';
import { recipeById } from '../data/recipes.js';
import { recipeTitle } from '../data/text.js';
import { mealsStore } from '../lib/stores.js';
import { useStored } from './useStored.js';

/**
 * id → food for planned meals: a recipe ("shakshuka") or one of your own
 * meals ("custom:k3x9"), as { kind, id, title, kcal, protein, carbs, fat,
 * recipe? }, or null when it no longer exists.
 */
export function useResolver() {
  const [meals] = useStored(mealsStore);
  return useMemo(() => {
    const custom = new Map(meals.map((m) => [`custom:${m.id}`, m]));
    return (id) => {
      const r = recipeById.get(id);
      if (r) return { kind: 'recipe', id, title: recipeTitle(r), kcal: r.kcal, protein: r.protein, carbs: r.carbs, fat: r.fat, recipe: r };
      const m = custom.get(id);
      if (m) return { kind: 'custom', id, title: m.name, kcal: m.kcal, protein: m.protein ?? 0, carbs: m.carbs ?? 0, fat: m.fat ?? 0, meal: m };
      return null;
    };
  }, [meals]);
}
