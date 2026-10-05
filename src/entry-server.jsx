// Prerendering (scripts/prerender.mjs): every page, once per language,
// rendered to static HTML. Lazy pages are awaited, so the HTML is complete.

import { prerenderToNodeStream } from 'react-dom/static';
import { StaticRouter } from 'react-router-dom';
import App from './App.jsx';
import ingredientsAr from './data/ingredients.ar.js';
import { imageFor, imageUrl } from './data/images.js';
import { getRecipe, recipes } from './data/recipes.js';
import recipesAr from './data/recipes.ar.js';
import { recipeDescription, recipeTitle } from './data/text.js';
import ar from './i18n/ar.js';
import { registerContent } from './i18n/content.js';
import { registerDictionary, t } from './i18n/index.js';
import { LOCALES, localizedPath, setActiveLocale } from './i18n/state.js';
import { pageOf } from './routes.js';

registerDictionary('ar', ar);
registerContent('ar', { recipes: recipesAr, ingredients: ingredientsAr });

/** Every page to prerender (in-app paths), plus the 404 fallback. */
export const paths = ['/', '/recipes', ...recipes.map((r) => `/recipes/${r.id}`), '/planner', '/shopping', '/calculator', '/privacy'];
export const notFoundPath = '/404';
export const locales = Object.keys(LOCALES);

function metaFor(path) {
  const page = pageOf(path);
  if (page === 'home') return { title: t('meta.title'), description: t('meta.description'), image: '/og.jpg' };
  if (page === 'recipe') {
    const r = getRecipe(path.split('/').pop());
    if (r) {
      return {
        title: t('meta.pages.recipe.title', { title: recipeTitle(r) }),
        description: t('meta.pages.recipe.description', { description: recipeDescription(r), kcal: r.kcal, protein: r.protein, time: r.prepTime }),
        image: imageUrl(r.id, 1200) ?? '/og.jpg',
      };
    }
  }
  const key = page === 'recipe' ? 'notFound' : page;
  return { title: t(`meta.pages.${key}.title`), description: t(`meta.pages.${key}.description`), image: '/og.jpg' };
}

export async function render(locale, path) {
  setActiveLocale(locale);
  const base = LOCALES[locale].base;
  const { prelude } = await prerenderToNodeStream(
    <StaticRouter location={localizedPath(path, locale)} basename={base || undefined}>
      <App />
    </StaticRouter>,
    // Never outline a big Suspense boundary behind an inline reveal script:
    // every page must be complete, in place, in the static HTML.
    { progressiveChunkSize: Number.MAX_SAFE_INTEGER },
  );
  let html = '';
  for await (const chunk of prelude) html += chunk;
  return { html, lang: locale, dir: LOCALES[locale].dir, page: pageOf(path), ...metaFor(path) };
}

export { HERO_SIZES, RECIPE_HERO_SIZES } from './data/images.js';
/** The home hero's srcsets, for the <link rel="preload"> in the head. */
export const heroImage = () => imageFor('home-hero');
/** A recipe page's photo (its largest paint), for the same kind of preload. */
export const recipeImage = (path) => {
  const id = path.split('/').pop();
  return getRecipe(id) ? imageFor(id) : null;
};
