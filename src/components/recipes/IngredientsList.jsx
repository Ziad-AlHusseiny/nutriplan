import { ingredientParts } from '../../data/text.js';
import { t } from '../../i18n/index.js';
import Stepper from '../ui/Stepper.jsx';
import SegmentedControl from '../ui/SegmentedControl.jsx';

/**
 * Ingredients with the servings stepper (PRD §5.3): amounts rescale by
 * servings ÷ base servings (PRD rounding); "to taste" never changes. A
 * Metric / US switch converts weights and volumes (BUILD-LOG).
 */
export default function IngredientsList({ recipe, servings, onServings, system, onSystem }) {
  const scale = servings / recipe.servings;
  return (
    <section aria-labelledby="ingredients-title" className="rounded-2xl border border-line bg-surface p-4 shadow-card md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h2 id="ingredients-title" className="type-heading-md text-ink">
          {t('recipe.ingredients')}
        </h2>
        <div className="flex items-center gap-3">
          <span className="type-caption text-muted" id="servings-label">
            {t('recipe.servings')}
          </span>
          <Stepper value={servings} min={1} max={8} step={1} onChange={onServings} decreaseLabel={t('recipe.decrease')} increaseLabel={t('recipe.increase')} label={t('recipe.servings')} testId="servings" />
        </div>
      </div>
      <SegmentedControl
        className="mt-4"
        legend={t('unitSystem.label')}
        legendClassName="sr-only"
        size="sm"
        value={system}
        onChange={onSystem}
        options={[
          { value: 'metric', label: t('unitSystem.metric'), testId: 'units-metric' },
          { value: 'us', label: t('unitSystem.us'), testId: 'units-us' },
        ]}
      />
      <ul className="mt-4 divide-y divide-line" data-testid="ingredients">
        {recipe.ingredients.map((ing) => {
          const parts = ingredientParts(ing, { scale, system });
          return (
            <li key={ing.item} className="flex gap-2 py-3" data-testid="ingredient">
              {parts.amount != null && (
                <span key={`${parts.amount}-${system}`} className="amount-fade font-semibold text-ink tabular">
                  {parts.amount}
                </span>
              )}{' '}
              <span className="text-ink">{parts.rest}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
