// Recipe and ingredient text in the active language, and ingredient lines
// ("450 g chicken breast", "3 حبات طماطم") with scaling and unit systems.

import { contentFor } from '../i18n/content.js';
import { t } from '../i18n/index.js';
import { activeLocale } from '../i18n/state.js';
import { formatAmount, formatQuarters, roundAmount } from '../lib/format.js';
import { displayQuantity } from '../lib/units.js';
import { ingredients } from './ingredients.js';

const arabic = () => (activeLocale() === 'ar' ? contentFor('ar') : null);

export const recipeTitle = (r) => arabic()?.recipes?.[r.id]?.title ?? r.title;
export const recipeDescription = (r) => arabic()?.recipes?.[r.id]?.description ?? r.description;

/** The method in the active language; timers come from the recipe data. */
export function recipeSteps(r) {
  const ar = arabic()?.recipes?.[r.id]?.steps;
  return r.steps.map((step, index) => ({ ...step, text: ar?.[index] ?? step.text }));
}

/** English name of a catalog item ([singular, plural] picks by amount). */
export function englishName(key, amount = 1) {
  const name = ingredients[key]?.en ?? key;
  if (!Array.isArray(name)) return name;
  return amount != null && amount > 1 ? name[1] : name[0];
}

/** An ingredient's name in the active language. */
export function ingredientName(key, amount = 1) {
  return arabic()?.ingredients?.[key] ?? englishName(key, amount);
}

/** Every searchable name of an ingredient (active language and English). */
export function ingredientSearchNames(key) {
  const names = [englishName(key, 1), englishName(key, 2)];
  const ar = contentFor('ar')?.ingredients?.[key];
  if (ar) names.push(ar);
  return names;
}

/** "2 tbsp" / "ملعقتان" — a unit word for an amount (plural rules per language). */
export const unitLabel = (unit, amount) => t(`units.${unit}`, { count: roundAmount(amount) });

/** Amount and the rest ("450" + "g chicken breast") for any item, amount and unit. */
const QUARTERS = new Set(['cup', 'qt']);

export function quantityParts(item, rawAmount, rawUnit, system = 'metric') {
  const { amount, unit } = displayQuantity(rawAmount, rawUnit, system);
  const rounded = QUARTERS.has(unit) ? Math.max(0.25, Math.round(amount * 4) / 4) : roundAmount(amount);
  const name = ingredientName(item, rounded);
  // English counts read "3 lemons"; Arabic adds a counter word: "3 حبات ليمون".
  // A fraction of a cup is still "cup": "¾ cup", "1½ cups".
  const count = QUARTERS.has(unit) ? (rounded > 1 ? 2 : 1) : rounded;
  const unitText = unit === 'pc' ? (activeLocale() === 'ar' ? unitLabel('pc', rounded) : '') : unitLabel(unit, count);
  return { amount: QUARTERS.has(unit) ? formatQuarters(amount) : formatAmount(amount), rest: [unitText, name].filter(Boolean).join(' ') };
}

/** "450 g chicken breast" for any item, amount and unit. */
export function quantityLine(item, amount, unit, system = 'metric') {
  const parts = quantityParts(item, amount, unit, system);
  return `${parts.amount} ${parts.rest}`;
}

/**
 * One ingredient, split for styling. `scale` multiplies the amount (servings
 * stepper); "to taste" items (amount null) never scale (PRD §5.3).
 */
export function ingredientParts(ing, { scale = 1, system = 'metric' } = {}) {
  if (ing.amount == null) return { amount: null, rest: t('ingredient.toTaste', { name: ingredientName(ing.item) }) };
  return quantityParts(ing.item, ing.amount * scale, ing.unit, system);
}

/** One ingredient as display text: "450 g chicken breast", "sea salt, to taste". */
export function ingredientLine(ing, opts) {
  const parts = ingredientParts(ing, opts);
  return parts.amount == null ? parts.rest : `${parts.amount} ${parts.rest}`;
}

/** Everything a search can match: the title (both languages) and every ingredient name. */
export function searchText(r) {
  const ar = contentFor('ar')?.recipes?.[r.id]?.title;
  return [r.title, ar, ...r.ingredients.flatMap((ing) => ingredientSearchNames(ing.item))].filter(Boolean).join(' · ');
}

/** Alt text for a recipe photo. */
export const photoAlt = (r) => recipeTitle(r);

/** A shopping-list row as text: "850 g chicken breast", "2 cans black beans", "1 head + 2 slices …", "sea salt, to taste". */
export function shoppingLine(row, quantities, system = 'metric') {
  if (!quantities.length) return t('ingredient.toTaste', { name: ingredientName(row.item) });
  if (quantities.length === 1) return quantityLine(row.item, quantities[0].amount, quantities[0].unit, system);
  const amounts = quantities.map((q) => {
    const { amount, unit } = displayQuantity(q.amount, q.unit, system);
    const rounded = QUARTERS.has(unit) ? Math.max(0.25, Math.round(amount * 4) / 4) : roundAmount(amount);
    const word = unit === 'pc' ? (activeLocale() === 'ar' ? unitLabel('pc', rounded) : '') : unitLabel(unit, QUARTERS.has(unit) ? (rounded > 1 ? 2 : 1) : rounded);
    return [QUARTERS.has(unit) ? formatQuarters(amount) : formatAmount(amount), word].filter(Boolean).join(' ');
  });
  return `${amounts.join(' + ')} ${ingredientName(row.item, 2)}`;
}
