// Number and amount formatting in the active locale (Latin digits in Arabic,
// wrapped in bidi isolates so "1,450 / 2,000" never reorders).

import { intlLocale, isolate } from '../i18n/state.js';

const cache = new Map();
function nf(options = {}) {
  const key = `${intlLocale()}|${JSON.stringify(options)}`;
  if (!cache.has(key)) cache.set(key, new Intl.NumberFormat(intlLocale(), options));
  return cache.get(key);
}

/** 1450 → "1,450" (no isolate: for aria values and composition). */
export const formatNumber = (n, options) => nf(options).format(n);

/** A number for display inside text: "1,450", isolated in Arabic. */
export const num = (n, options) => isolate(formatNumber(n, options));

/** kcal values are whole numbers: 1450.4 → "1,450". */
export const formatKcal = (n) => num(Math.round(n));

/**
 * PRD §5.3 rounding for scaled amounts: below 10, one decimal with a
 * trailing ".0" dropped; 10 and above, whole numbers.
 */
export function roundAmount(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.abs(n) < 10 ? Math.round(n * 10) / 10 : Math.round(n);
}

export const formatAmount = (n) => formatNumber(roundAmount(n), { maximumFractionDigits: 1, useGrouping: true });

/** Servings like 1, 1.5, 2: "×1.5". */
export const formatServings = (n) => formatNumber(n, { maximumFractionDigits: 2 });

export const percent = (fraction) => Math.round(fraction * 100);

const dateCache = new Map();
/** A date in the active locale: formatDate(d, { day: 'numeric', month: 'short' }) → "Oct 5" / "5 أكتوبر". */
export function formatDate(date, options) {
  const key = `${intlLocale()}|${JSON.stringify(options)}`;
  if (!dateCache.has(key)) dateCache.set(key, new Intl.DateTimeFormat(intlLocale(), options));
  return dateCache.get(key).format(date);
}

/** ["Breakfast", "Snacks"] → "Breakfast and Snacks" / «الفطور والوجبات الخفيفة». */
export const formatList = (items, type = 'conjunction') => new Intl.ListFormat(intlLocale(), { type }).format(items);

const FRACTIONS = { 0.25: '¼', 0.5: '½', 0.75: '¾' };
/** Cups and quarts read in quarters: 0.75 → "¾", 1.5 → "1½" (rounded to the nearest quarter, at least ¼). */
export function formatQuarters(n) {
  const q = Math.max(0.25, Math.round(n * 4) / 4);
  const whole = Math.floor(q);
  const frac = FRACTIONS[q - whole] ?? '';
  return whole ? `${formatNumber(whole)}${frac}` : frac;
}
