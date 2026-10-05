// The shopping list (BUILD-LOG: reversed non-goal). Every planned recipe's
// ingredients, scaled to the servings planned, merged by catalog item across
// the week, with units normalized (kg+g, l+ml+spoons) and amounts rounded
// *up* to something you can buy, grouped by store aisle.

import { AISLES, ingredients } from '../data/ingredients.js';
import { COUNT_UNITS, displayQuantity, MASS, VOLUME } from './units.js';

/**
 * @param {Array} entries  [{ entry: { id, servings }, day }] from the plan
 * @param {Function} getRecipe id → recipe or null (custom meals return null)
 * @returns {{ rows: Array, skipped: string[] }}
 *   rows: [{ item, aisle, mass, volume, spoonsOnly, counts: { unit: n }, toTaste, recipes: [id] }]
 *   skipped: ids planned that have no ingredient list (your own meals)
 */
export function buildShoppingList(entries, getRecipe) {
  const rows = new Map();
  const skipped = [];
  for (const { entry } of entries) {
    const recipe = getRecipe(entry.id);
    if (!recipe) {
      if (!skipped.includes(entry.id)) skipped.push(entry.id);
      continue;
    }
    const factor = (entry.servings ?? 1) / recipe.servings;
    for (const ing of recipe.ingredients) {
      const meta = ingredients[ing.item];
      if (!meta) continue;
      if (!rows.has(ing.item)) {
        rows.set(ing.item, { item: ing.item, aisle: meta.aisle, mass: 0, volume: 0, spoonsOnly: true, counts: {}, toTaste: false, recipes: [] });
      }
      const row = rows.get(ing.item);
      if (!row.recipes.includes(recipe.id)) row.recipes.push(recipe.id);
      if (ing.amount == null) {
        row.toTaste = true;
        continue;
      }
      const amount = ing.amount * factor;
      if (ing.unit in MASS) row.mass += amount * MASS[ing.unit];
      else if (ing.unit in VOLUME) {
        row.volume += amount * VOLUME[ing.unit];
        if (ing.unit !== 'tsp' && ing.unit !== 'tbsp') row.spoonsOnly = false;
      } else if (COUNT_UNITS.includes(ing.unit)) row.counts[ing.unit] = (row.counts[ing.unit] ?? 0) + amount;
    }
  }
  return { rows: [...rows.values()], skipped };
}

const ceilTo = (n, step) => Math.round(Math.ceil(n / step - 1e-9) * step * 1000) / 1000;

/**
 * The quantities a row should show, rounded up to buyable amounts:
 * [{ amount, unit }]. Empty for a "to taste" item with no amount.
 */
export function rowQuantities(row, system = 'metric') {
  const out = [];
  if (row.mass > 0) {
    const q = displayQuantity(row.mass, 'g', system);
    const step = { g: row.mass < 100 ? 5 : 10, kg: 0.1, oz: 0.5, lb: 0.1 }[q.unit];
    out.push({ amount: ceilTo(q.amount, step), unit: q.unit });
  }
  if (row.volume > 0) {
    if (row.spoonsOnly && row.volume < 240) {
      // Oils, sauces and spices: keep the spoons people measure with.
      out.push(row.volume >= 15 ? { amount: ceilTo(row.volume / 15, 0.5), unit: 'tbsp' } : { amount: ceilTo(row.volume / 5, 0.5), unit: 'tsp' });
    } else {
      const q = displayQuantity(row.volume, 'ml', system);
      const step = { ml: 10, l: 0.1, tsp: 0.5, tbsp: 0.5, cup: 0.25, qt: 0.25 }[q.unit];
      out.push({ amount: ceilTo(q.amount, step), unit: q.unit });
    }
  }
  for (const unit of COUNT_UNITS) {
    if (row.counts[unit] > 0) out.push({ amount: ceilTo(row.counts[unit], unit === 'head' ? 0.5 : 1), unit });
  }
  return out;
}

/** Rows grouped by aisle, in store order; names sorted with `compare`. */
export function groupByAisle(rows, nameOf, compare = (a, b) => a.localeCompare(b)) {
  const groups = AISLES.map((aisle) => ({ aisle, rows: [] }));
  const index = new Map(groups.map((g) => [g.aisle, g]));
  for (const row of rows) (index.get(row.aisle) ?? index.get('other')).rows.push(row);
  for (const g of groups) g.rows.sort((a, b) => compare(nameOf(a), nameOf(b)));
  return groups.filter((g) => g.rows.length);
}

/**
 * Plain-text list for sharing (messages, notes apps). Only what's still
 * to buy: checked and "already have" rows are left out.
 */
export function shareText({ title, subtitle, groups, lineOf, aisleName, extras = [], extrasTitle, footer }) {
  const lines = [title];
  if (subtitle) lines.push(subtitle);
  for (const g of groups) {
    if (!g.rows.length) continue;
    lines.push('', aisleName(g.aisle));
    for (const row of g.rows) lines.push(`- ${lineOf(row)}`);
  }
  const open = extras.filter((e) => !e.checked);
  if (open.length) {
    lines.push('', extrasTitle);
    for (const e of open) lines.push(`- ${e.text}`);
  }
  if (footer) lines.push('', footer);
  return `${lines.join('\n')}\n`;
}
