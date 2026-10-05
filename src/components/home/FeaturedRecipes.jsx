import { Link } from 'react-router-dom';
import { featuredRecipeIds, getRecipe } from '../../data/recipes.js';
import { t } from '../../i18n/index.js';
import RecipeCard from '../recipes/RecipeCard.jsx';

/** "Fresh this week" (PRD §3.3): the three featured recipes. */
export default function FeaturedRecipes() {
  const featured = featuredRecipeIds.map(getRecipe).filter(Boolean);
  return (
    <section className="page-x py-12 md:py-16" aria-labelledby="featured-title">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h2 id="featured-title" className="type-heading-md text-ink">
            {t('home.featured.title')}
          </h2>
          <p className="mt-2 text-muted">{t('home.featured.sub')}</p>
        </div>
        <Link to="/recipes" className="inline-flex min-h-11 items-center font-semibold text-brand-ink underline-offset-4 hover:underline">
          {t('home.featured.seeAll')}
        </Link>
      </div>
      <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {featured.map((r, i) => (
          <li key={r.id} data-reveal style={{ '--i': i }}>
            <RecipeCard recipe={r} />
          </li>
        ))}
      </ul>
    </section>
  );
}
