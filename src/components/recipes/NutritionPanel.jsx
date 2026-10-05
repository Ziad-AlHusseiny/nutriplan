import { useRef } from 'react';
import { useReveal } from '../../hooks/useReveal.js';
import { useStored } from '../../hooks/useStored.js';
import { t } from '../../i18n/index.js';
import { macroShares } from '../../lib/calculations.js';
import { formatKcal } from '../../lib/format.js';
import { targetStore } from '../../lib/stores.js';
import MacroDonut from './MacroDonut.jsx';
import MacroRing from './MacroRing.jsx';

const COLORS = { protein: 'var(--color-protein)', carbs: 'var(--color-carbs)', fat: 'var(--color-fat)' };

/** "Nutrition per serving" (PRD §5.5): the donut and three rings, filling as the panel enters the viewport. */
export default function NutritionPanel({ recipe }) {
  const ref = useRef(null);
  const phase = useReveal(ref);
  const { ofKcal } = macroShares(recipe);
  const [target] = useStored(targetStore);
  return (
    <section ref={ref} aria-labelledby="nutrition-title" className="rounded-2xl border border-line bg-surface p-4 shadow-card md:p-6" data-testid="nutrition-panel" data-phase={phase}>
      <h2 id="nutrition-title" className="type-heading-md text-ink">
        {t('recipe.nutrition')}
      </h2>
      <div className="mt-6 flex flex-col items-center gap-8 md:flex-row md:justify-center lg:flex-col">
        <MacroDonut recipe={recipe} phase={phase} />
        <div className="grid w-full max-w-sm grid-cols-3 gap-2">
          {['protein', 'carbs', 'fat'].map((m, i) => (
            <MacroRing key={m} macro={m} grams={recipe[m]} fraction={ofKcal[m]} color={COLORS[m]} phase={phase} delay={i * 120} />
          ))}
        </div>
      </div>
      <p className="mt-6 rounded-xl bg-subtle px-4 py-3 text-center text-sm text-muted" data-testid="share-of-target">
        {t('recipe.ofTarget', { percent: Math.round((recipe.kcal / target) * 100), target: formatKcal(target) })}
      </p>
    </section>
  );
}
