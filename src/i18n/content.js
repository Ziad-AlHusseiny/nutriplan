// Localized recipe content (titles, descriptions, steps, ingredient names).
// English is inline in data/recipes.js and data/ingredients.js; Arabic is
// registered here by loadDictionary('ar') (or the prerender entry).

const CONTENT = {};

export function registerContent(locale, content) {
  CONTENT[locale] = { ...CONTENT[locale], ...content };
}

export const contentFor = (locale) => CONTENT[locale] ?? null;
