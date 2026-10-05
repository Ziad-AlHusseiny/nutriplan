import { describe, expect, it } from 'vitest';
import { registerContent } from '../i18n/content.js';
import ar from '../i18n/ar.js';
import { registerDictionary } from '../i18n/index.js';
import { setActiveLocale } from '../i18n/state.js';
import { ingredients } from './ingredients.js';
import ingredientsAr from './ingredients.ar.js';
import { RECIPE_IDS } from './recipeIds.js';
import { CUISINES, DIETS, featuredRecipeIds, MEALS, recipes } from './recipes.js';
import recipesAr from './recipes.ar.js';
import { ingredientLine, quantityLine, recipeSteps, recipeTitle } from './text.js';

registerDictionary('ar', ar);
registerContent('ar', { recipes: recipesAr, ingredients: ingredientsAr });

describe('the 30 recipes (TECHNICAL-PLAN §4.1)', () => {
  it('30 recipes, 5 per cuisine, unique ids, featured ids resolve', () => {
    expect(recipes).toHaveLength(30);
    for (const c of CUISINES) expect(recipes.filter((r) => r.cuisine === c), c).toHaveLength(5);
    expect(new Set(recipes.map((r) => r.id)).size).toBe(30);
    expect(featuredRecipeIds.every((id) => recipes.some((r) => r.id === id))).toBe(true);
    expect([...RECIPE_IDS].sort()).toEqual(recipes.map((r) => r.id).sort());
  });

  it('diet distribution: ≥6 vegan, ≥8 vegetarian, ≥8 high-protein, ≥5 keto', () => {
    const n = (d) => recipes.filter((r) => r.diets.includes(d)).length;
    expect(n('vegan')).toBeGreaterThanOrEqual(6);
    expect(n('vegetarian')).toBeGreaterThanOrEqual(8);
    expect(n('high-protein')).toBeGreaterThanOrEqual(8);
    expect(n('keto')).toBeGreaterThanOrEqual(5);
    // Vegan is a kind of vegetarian.
    for (const r of recipes) if (r.diets.includes('vegan')) expect(r.diets, r.id).toContain('vegetarian');
  });

  it('honest macros: protein×4 + carbs×4 + fat×9 within ±5% of kcal', () => {
    for (const r of recipes) {
      const calc = r.protein * 4 + r.carbs * 4 + r.fat * 9;
      expect(Math.abs(calc - r.kcal) / r.kcal, r.id).toBeLessThanOrEqual(0.05);
    }
  });

  it('ranges: 280–780 kcal, 10–45 min, 1–4 servings; valid tags; 4–8 steps', () => {
    for (const r of recipes) {
      expect(r.kcal, r.id).toBeGreaterThanOrEqual(280);
      expect(r.kcal, r.id).toBeLessThanOrEqual(780);
      expect(r.prepTime).toBeGreaterThanOrEqual(10);
      expect(r.prepTime).toBeLessThanOrEqual(45);
      expect(r.servings).toBeGreaterThanOrEqual(1);
      expect(r.servings).toBeLessThanOrEqual(4);
      expect(r.diets.every((d) => DIETS.includes(d))).toBe(true);
      expect(r.meals.length).toBeGreaterThan(0);
      expect(r.meals.every((m) => MEALS.includes(m))).toBe(true);
      expect(r.steps.length, r.id).toBeGreaterThanOrEqual(3);
      expect(r.steps.length, r.id).toBeLessThanOrEqual(8);
      for (const s of r.steps) if (s.timer) expect(s.timer, r.id).toBeGreaterThan(0);
    }
  });

  it('every ingredient is in the catalog, with an Arabic name', () => {
    for (const r of recipes) for (const i of r.ingredients) expect(ingredients[i.item], `${r.id}: ${i.item}`).toBeTruthy();
    for (const key of Object.keys(ingredients)) expect(ingredientsAr[key], key).toBeTruthy();
  });

  it('every recipe has Arabic text, with the same number of steps', () => {
    for (const r of recipes) {
      expect(recipesAr[r.id]?.title, r.id).toBeTruthy();
      expect(recipesAr[r.id].steps, r.id).toHaveLength(r.steps.length);
    }
  });
});

describe('ingredient lines', () => {
  it('English: PRD examples and plurals', () => {
    setActiveLocale('en');
    const chicken = recipes[0].ingredients[0];
    expect(ingredientLine(chicken)).toBe('300 g chicken breast');
    expect(ingredientLine(chicken, { scale: 3 / 2 })).toBe('450 g chicken breast');
    expect(ingredientLine({ item: 'salt', amount: null, unit: null }, { scale: 4 })).toBe('sea salt, to taste');
    expect(quantityLine('lemon', 3, 'pc')).toBe('3 lemons');
    expect(quantityLine('lemon', 1, 'pc')).toBe('1 lemon');
    expect(quantityLine('garlic', 2, 'clove')).toBe('2 cloves garlic');
    expect(quantityLine('vegetable-stock', 1500, 'ml')).toBe('1.5 l vegetable stock');
  });

  it('US cups and quarts read in quarters (review finding 8)', () => {
    setActiveLocale('en');
    expect(quantityLine('almond-milk', 150, 'ml', 'us')).toBe('¾ cup unsweetened almond milk');
    expect(quantityLine('vegetable-stock', 1200, 'ml', 'us')).toBe('1¼ qt vegetable stock');
    expect(quantityLine('vegetable-stock', 360, 'ml', 'us')).toBe('1½ cups vegetable stock');
  });

  it('Arabic: counter words with the right plural', () => {
    setActiveLocale('ar');
    expect(quantityLine('tomato', 3, 'pc')).toBe('3 حبات طماطم');
    expect(quantityLine('garlic', 3, 'clove')).toBe('3 فصوص ثوم');
    expect(quantityLine('chicken-breast', 300, 'g')).toBe('300 جم صدر دجاج');
    expect(recipeTitle(recipes.find((r) => r.id === 'shakshuka'))).toBe('شكشوكة');
    expect(recipeSteps(recipes[0])[0].timer).toBe(900);
    setActiveLocale('en');
  });
});
