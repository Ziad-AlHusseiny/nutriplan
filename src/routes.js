// The pages and their code-split chunks. main.jsx preloads the chunk of the
// page being hydrated; prerender.mjs adds a modulepreload for it.

export const pageLoaders = {
  home: () => import('./pages/HomePage.jsx'),
  recipes: () => import('./pages/RecipesPage.jsx'),
  recipe: () => import('./pages/RecipeDetailPage.jsx'),
  planner: () => import('./pages/PlannerPage.jsx'),
  shopping: () => import('./pages/ShoppingPage.jsx'),
  calculator: () => import('./pages/CalculatorPage.jsx'),
  privacy: () => import('./pages/PrivacyPage.jsx'),
  notFound: () => import('./pages/NotFoundPage.jsx'),
};

/** Which page an in-app path (no /ar prefix) renders. */
export function pageOf(path) {
  const p = path.replace(/\/+$/, '') || '/';
  if (p === '/') return 'home';
  if (p === '/recipes') return 'recipes';
  if (/^\/recipes\/[^/]+$/.test(p)) return 'recipe';
  if (p === '/planner') return 'planner';
  if (p === '/shopping') return 'shopping';
  if (p === '/calculator') return 'calculator';
  if (p === '/privacy') return 'privacy';
  return 'notFound';
}
