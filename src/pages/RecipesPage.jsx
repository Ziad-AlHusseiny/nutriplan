import { SearchX } from 'lucide-react';
import { useMemo } from 'react';
import RecipeFilters from '../components/recipes/RecipeFilters.jsx';
import RecipeGrid from '../components/recipes/RecipeGrid.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { recipes } from '../data/recipes.js';
import { searchText } from '../data/text.js';
import { useDebounced } from '../hooks/useDebounced.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useFavorites } from '../hooks/useFavorites.js';
import { t } from '../i18n/index.js';
import { DEFAULT_FILTERS, filterRecipes } from '../lib/filters.js';
import { filtersSession, querySession, useSession } from '../lib/session.js';

/** /recipes (PRD §4): header → filters → count → grid or empty state. */
export default function RecipesPage() {
  useDocumentTitle(t('meta.pages.recipes.title'));
  const [filters, setFilters] = useSession(filtersSession);
  const [query, setQuery] = useSession(querySession);
  const debouncedQuery = useDebounced(query, 200);
  const [favorites] = useFavorites();

  const results = useMemo(() => filterRecipes(recipes, { ...filters, query: debouncedQuery }, { textOf: searchText, favorites }), [filters, debouncedQuery, favorites]);

  const clearAll = () => {
    setFilters({ ...DEFAULT_FILTERS });
    setQuery('');
  };

  return (
    <div className="page-x pt-8 md:pt-12">
      <header className="max-w-2xl">
        <h1 className="type-display-lg text-ink">{t('recipes.title')}</h1>
        <p className="mt-3 type-body-lg text-muted">{t('recipes.sub')}</p>
      </header>
      <div className="mt-8">
        <RecipeFilters filters={filters} onChange={setFilters} onClear={clearAll} query={query} onQuery={setQuery} />
      </div>
      <h2 className="mt-8 mb-4 text-base font-semibold text-ink" aria-live="polite" data-testid="result-count">
        {t('recipes.count', { count: results.length })}
      </h2>
      {results.length ? (
        <RecipeGrid recipes={results} priorityCount={1} />
      ) : (
        <EmptyState icon={SearchX} title={t('recipes.empty.title')} body={t('recipes.empty.body')} actionLabel={t('recipes.empty.action')} onAction={clearAll} actionVariant="primary" />
      )}
    </div>
  );
}
