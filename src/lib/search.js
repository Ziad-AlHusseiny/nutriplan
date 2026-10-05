// Search text normalization. Case- and accent-insensitive in English;
// in Arabic, also ignores diacritics and the usual spelling variants
// (أ إ آ → ا, ة → ه, ى → ي), so "شوربه عدس" finds «شوربة عدس».

import { intlLocale } from '../i18n/state.js';

const ARABIC_MARKS = /[\u064B-\u065F\u0670\u0640]/g; // tashkeel, superscript alef, tatweel

export function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(ARABIC_MARKS, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

/** True when every word of the query appears in the haystack. */
export function matchesQuery(haystack, query) {
  const q = normalize(query);
  if (!q) return true;
  const h = normalize(haystack);
  return q.split(' ').every((word) => h.includes(word));
}

const collators = new Map();
/** Alphabetical order in the active language (shopping list rows). */
export function compareText(a, b) {
  const locale = intlLocale();
  if (!collators.has(locale)) collators.set(locale, new Intl.Collator(locale, { sensitivity: 'base' }));
  return collators.get(locale).compare(a, b);
}
