import { describe, expect, it } from 'vitest';
import { recipeById } from '../data/recipes.js';
import { buildShoppingList, groupByAisle, rowQuantities, shareText } from './shopping.js';

const getRecipe = (id) => recipeById.get(id) ?? null;
const rowOf = (list, item) => list.rows.find((r) => r.item === item);
const plan = (...pairs) => pairs.map(([id, servings = 1]) => ({ entry: { id, servings } }));

describe('shopping list merging', () => {
  it('scales by planned servings ÷ recipe servings', () => {
    // Grilled lemon chicken bowl: 300 g chicken for 2 servings; 3 planned → 450 g.
    const list = buildShoppingList(plan(['grilled-lemon-chicken-bowl', 3]), getRecipe);
    expect(rowOf(list, 'chicken-breast').mass).toBe(450);
    expect(rowQuantities(rowOf(list, 'chicken-breast'))).toEqual([{ amount: 450, unit: 'g' }]);
  });

  it('merges the same item across recipes (lemon, chicken breast, garlic)', () => {
    const list = buildShoppingList(plan(['grilled-lemon-chicken-bowl', 2], ['chicken-fajitas', 2], ['cobb-salad', 2]), getRecipe);
    expect(rowOf(list, 'chicken-breast').mass).toBe(300 + 300 + 250);
    expect(rowQuantities(rowOf(list, 'chicken-breast'))).toEqual([{ amount: 850, unit: 'g' }]);
    expect(rowOf(list, 'chicken-breast').recipes).toEqual(['grilled-lemon-chicken-bowl', 'chicken-fajitas', 'cobb-salad']);
    expect(list.rows.filter((r) => r.item === 'chicken-breast')).toHaveLength(1);
  });

  it('normalizes units: grams to kilograms, spoons kept as spoons, millilitres to litres', () => {
    const list = buildShoppingList(plan(['minestrone-soup', 4], ['mushroom-risotto', 4], ['red-lentil-soup', 4]), getRecipe);
    // 1,200 + 1,200 + 1,500 ml of stock.
    expect(rowQuantities(rowOf(list, 'vegetable-stock'))).toEqual([{ amount: 3.9, unit: 'l' }]);
    // Olive oil: 2 tbsp + 1 tbsp + 2 tbsp = 75 ml → 5 tbsp.
    expect(rowQuantities(rowOf(list, 'olive-oil'))).toEqual([{ amount: 5, unit: 'tbsp' }]);
    const big = buildShoppingList(plan(['turkey-chili', 8], ['turkey-meatballs-marinara', 4]), getRecipe);
    expect(rowQuantities(rowOf(big, 'ground-turkey'))).toEqual([{ amount: 1.5, unit: 'kg' }]);
  });

  it('rounds up to what you can buy: whole items, whole cans, 10 g', () => {
    // Shakshuka ×1 (of 2): 2 eggs, ½ can tomatoes, ½ onion.
    const list = buildShoppingList(plan(['shakshuka', 1], ['huevos-rancheros', 1]), getRecipe);
    expect(rowQuantities(rowOf(list, 'eggs'))).toEqual([{ amount: 4, unit: 'pc' }]);
    expect(rowQuantities(rowOf(list, 'canned-tomatoes'))).toEqual([{ amount: 1, unit: 'can' }]);
    expect(rowQuantities(rowOf(list, 'onion'))).toEqual([{ amount: 1, unit: 'pc' }]);
    expect(rowQuantities(rowOf(list, 'feta'))).toEqual([{ amount: 35, unit: 'g' }]);
    expect(rowQuantities(rowOf(list, 'cumin'))).toEqual([{ amount: 1, unit: 'tsp' }]);
  });

  it('keeps "to taste" items without an amount', () => {
    const list = buildShoppingList(plan(['shakshuka']), getRecipe);
    expect(rowOf(list, 'salt').toTaste).toBe(true);
    expect(rowQuantities(rowOf(list, 'salt'))).toEqual([]);
  });

  it('lists your own meals as skipped (no ingredients)', () => {
    const list = buildShoppingList(plan(['custom:koshari'], ['custom:koshari'], ['shakshuka']), getRecipe);
    expect(list.skipped).toEqual(['custom:koshari']);
  });

  it('US units: ounces, pounds and cups', () => {
    const list = buildShoppingList(plan(['grilled-lemon-chicken-bowl', 2]), getRecipe);
    expect(rowQuantities(rowOf(list, 'chicken-breast'), 'us')).toEqual([{ amount: 11, unit: 'oz' }]);
    const soup = buildShoppingList(plan(['red-lentil-soup', 4]), getRecipe);
    expect(rowQuantities(rowOf(soup, 'vegetable-stock'), 'us')).toEqual([{ amount: 1.75, unit: 'qt' }]);
  });

  it('groups by aisle in store order, sorted by name', () => {
    const list = buildShoppingList(plan(['grilled-lemon-chicken-bowl'], ['shakshuka']), getRecipe);
    const groups = groupByAisle(list.rows, (r) => r.item);
    expect(groups.map((g) => g.aisle)).toEqual(['produce', 'meat', 'dairy', 'grains', 'canned', 'pantry']);
    const produce = groups[0].rows.map((r) => r.item);
    expect(produce).toEqual([...produce].sort());
  });

  it('shares plain text with only what is left to buy', () => {
    const text = shareText({
      title: 'Shopping list',
      groups: [{ aisle: 'produce', rows: [{ item: 'lemon' }] }, { aisle: 'meat', rows: [] }],
      lineOf: (r) => `1 ${r.item}`,
      aisleName: (a) => a.toUpperCase(),
      extras: [{ text: 'coffee', checked: false }, { text: 'tea', checked: true }],
      extrasTitle: 'Extras',
      footer: 'Made with NutriPlan',
    });
    expect(text).toBe('Shopping list\n\nPRODUCE\n- 1 lemon\n\nExtras\n- coffee\n\nMade with NutriPlan\n');
  });
});
