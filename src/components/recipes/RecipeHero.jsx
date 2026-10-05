import { Clock, Users } from 'lucide-react';
import { RECIPE_HERO_SIZES } from '../../data/images.js';
import { photoAlt, recipeDescription, recipeTitle } from '../../data/text.js';
import { t } from '../../i18n/index.js';
import { num } from '../../lib/format.js';
import Badge from '../ui/Badge.jsx';
import RecipeImage from '../ui/RecipeImage.jsx';

/** Photo (16:9 desktop, 4:3 mobile), title, description, badges (PRD §5.2). */
export default function RecipeHero({ recipe, children }) {
  return (
    <header>
      <RecipeImage id={recipe.id} alt={photoAlt(recipe)} priority sizes={RECIPE_HERO_SIZES} className="block aspect-[4/3] overflow-hidden rounded-2xl shadow-card md:aspect-[16/9]" />
      <div className="mt-6 md:mt-8">
        <h1 className="type-display-lg text-ink">{recipeTitle(recipe)}</h1>
        <p className="mt-3 max-w-3xl type-body-lg text-muted">{recipeDescription(recipe)}</p>
        <ul className="mt-5 flex flex-wrap gap-2" aria-label={t('recipe.nutrition')}>
          <li>
            <Badge tone="orange">{t('recipe.kcalPerServing', { value: num(recipe.kcal) })}</Badge>
          </li>
          <li>
            <Badge tone="green" icon={Clock}>
              {t('common.minutes', { value: num(recipe.prepTime), count: recipe.prepTime })}
            </Badge>
          </li>
          <li>
            <Badge icon={Users}>{t('common.servings', { count: recipe.servings })}</Badge>
          </li>
          <li>
            <Badge>{t(`cuisines.${recipe.cuisine}`)}</Badge>
          </li>
          {recipe.diets.map((d) => (
            <li key={d}>
              <Badge>{t(`diets.${d}`)}</Badge>
            </li>
          ))}
        </ul>
        {children}
      </div>
    </header>
  );
}
