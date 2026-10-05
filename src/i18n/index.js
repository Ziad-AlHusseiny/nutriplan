// A small translator: nested dictionaries, {placeholders}, CLDR plural forms
// (Arabic has six), and rich templates that can embed elements. English is
// bundled; Arabic (UI and recipe text) loads on demand and is preloaded on /ar.

import { createElement, Fragment } from 'react';
import en from './en.js';
import { registerContent } from './content.js';
import { activeLocale, LOCALES } from './state.js';

const DICTS = { en };

export function registerDictionary(locale, dict) {
  DICTS[locale] = dict;
}

export const hasDictionary = (locale) => Boolean(DICTS[locale]);

/** Loads a locale's dictionary and recipe text (lazy chunks for Arabic). */
export async function loadDictionary(locale) {
  if (locale !== 'ar' || DICTS.ar) return;
  const [dict, recipesAr, ingredientsAr] = await Promise.all([
    import('./ar.js'),
    import('../data/recipes.ar.js'),
    import('../data/ingredients.ar.js'),
  ]);
  registerContent('ar', { recipes: recipesAr.default, ingredients: ingredientsAr.default });
  registerDictionary('ar', dict.default);
}

// Own properties only: a stray key like "constructor" must never resolve.
function lookup(dict, key) {
  return key.split('.').reduce((node, part) => (node != null && typeof node === 'object' && Object.hasOwn(node, part) ? node[part] : undefined), dict);
}

export function interpolate(template, params = {}) {
  return template.replace(/\{(\w+)\}/g, (match, name) => (params[name] == null ? match : String(params[name])));
}

function resolve(locale, key, params) {
  let value = lookup(DICTS[locale] ?? en, key) ?? lookup(en, key);
  if (value == null || (typeof value !== 'string' && typeof value !== 'object')) return key;
  if (typeof value === 'object' && !Array.isArray(value)) {
    const count = params?.count ?? 0;
    // An explicit zero form wins in any language ("Nothing is saved yet.").
    const category = count === 0 && value.zero ? 'zero' : new Intl.PluralRules(LOCALES[locale].plural).select(count);
    value = value[category] ?? value.other;
  }
  return typeof value === 'string' ? value : key;
}

/** t('nav.recipes'), t('recipes.count', { count: 18 }) */
export function t(key, params) {
  return interpolate(resolve(activeLocale(), key, params), params);
}

/** Always English: stable values for exports and tests. */
export function tEn(key, params) {
  return interpolate(resolve('en', key, params), params);
}

/** True when the key exists (in the active locale or English). */
export function has(key) {
  return lookup(DICTS[activeLocale()] ?? en, key) != null || lookup(en, key) != null;
}

/** A list from the dictionary. */
export function list(key) {
  const value = lookup(DICTS[activeLocale()] ?? en, key) ?? lookup(en, key);
  return Array.isArray(value) ? value : [];
}

/**
 * Like t(), but returns an array so placeholders can be React elements:
 * rich('safety.support', { link: <a href="…">findahelpline.com</a> }).
 */
export function rich(key, params = {}) {
  const template = resolve(activeLocale(), key, params);
  return template
    .split(/(\{\w+\})/)
    .filter(Boolean)
    .map((part, i) => {
      const name = part.match(/^\{(\w+)\}$/)?.[1];
      return createElement(Fragment, { key: i }, name && params[name] != null ? params[name] : part);
    });
}

export { DICTS };
