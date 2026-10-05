import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { photoAlt, recipeTitle } from '../../data/text.js';
import { t } from '../../i18n/index.js';
import { num } from '../../lib/format.js';
import Badge from '../ui/Badge.jsx';
import RecipeImage from '../ui/RecipeImage.jsx';
import FavoriteButton from './FavoriteButton.jsx';

/**
 * Recipe card (PRD §4.3): photo, title, cuisine, kcal and time badges, diet
 * micro-chips. The whole card is one link (a stretched title link); the
 * heart sits above it. Hover lifts the card and scales the photo (CSS).
 */
export default function RecipeCard({ recipe, priority = false, headingLevel = 3 }) {
  const title = recipeTitle(recipe);
  const Heading = `h${headingLevel}`;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-card transition-[transform,box-shadow] duration-(--duration-ui) ease-(--ease-standard) has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-brand motion-safe:hover:-translate-y-1 hover:shadow-lift" data-testid="recipe-card" data-id={recipe.id}>
      <div className="relative aspect-[4/3] overflow-hidden">
        <RecipeImage id={recipe.id} alt={photoAlt(recipe)} sizes="(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw" priority={priority} imgClassName="transition-transform duration-(--duration-ui) ease-(--ease-standard) motion-safe:group-hover:scale-[1.03]" className="block size-full" />
      </div>
      <div className="flex flex-1 flex-col p-4 md:p-5">
        <p className="text-sm font-medium text-muted">{t(`cuisines.${recipe.cuisine}`)}</p>
        <Heading className="mt-1 type-heading-sm text-ink">
          <Link to={`/recipes/${recipe.id}`} className="outline-none after:absolute after:inset-0 after:z-[1] after:content-['']">
            {title}
          </Link>
        </Heading>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          <Badge tone="orange">{t('common.kcal', { value: num(recipe.kcal) })}</Badge>
          <Badge tone="green" icon={Clock}>
            {t('common.minutes', { value: num(recipe.prepTime), count: recipe.prepTime })}
          </Badge>
          {recipe.diets.map((d) => (
            <span key={d} className="inline-flex min-h-6 items-center rounded-full border border-line px-2.5 text-xs font-semibold text-muted">
              {t(`diets.${d}`)}
            </span>
          ))}
        </div>
      </div>
      <FavoriteButton id={recipe.id} title={title} className="absolute end-3 top-3 z-[2]" />
    </article>
  );
}
