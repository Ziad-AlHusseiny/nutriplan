import { ChefHat } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHydrated } from '../../hooks/useMedia.js';
import { useResolver } from '../../hooks/useResolver.js';
import { useStored } from '../../hooks/useStored.js';
import { t } from '../../i18n/index.js';
import { formatKcal, formatServings } from '../../lib/format.js';
import { dayTotals, getWeek } from '../../lib/plan.js';
import { planStore } from '../../lib/stores.js';
import { DAYS, SLOTS, weekKeyOf } from '../../lib/week.js';
import Button from '../ui/Button.jsx';
import RecipeImage from '../ui/RecipeImage.jsx';

/**
 * Today's meals for someone who already plans (appears after hydration;
 * it sits below the fold, so it never shifts what's on screen).
 */
export default function TodayCard() {
  const hydrated = useHydrated();
  const [plan] = useStored(planStore);
  const resolve = useResolver();
  if (!hydrated || !Object.keys(plan.weeks).length) return null;

  const now = new Date();
  const day = DAYS[(now.getDay() + 6) % 7];
  const today = getWeek(plan, weekKeyOf(now))[day];
  const meals = SLOTS.map((slot) => ({ slot, entry: today[slot], food: today[slot] && resolve(today[slot].id) })).filter((m) => m.food);
  const total = dayTotals(today, resolve).kcal;

  return (
    <section className="page-x py-6" aria-labelledby="today-title" data-testid="today-card">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card md:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="today-title" className="type-heading-sm text-ink">
            {t('home.today.title')} · {t(`days.${day}`)}
          </h2>
          {meals.length > 0 && <p className="text-sm font-semibold text-accent-ink">{t('home.today.total', { value: formatKcal(total) })}</p>}
        </div>
        {meals.length ? (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {meals.map(({ slot, entry, food }) => (
              <li key={slot} className="flex items-center gap-3 rounded-xl bg-subtle p-2 pe-3">
                {food.kind === 'recipe' ? <RecipeImage id={food.id} alt="" sizes="56px" max={480} className="block size-14 shrink-0 overflow-hidden rounded-md" /> : <span className="grid size-14 shrink-0 place-items-center rounded-md bg-accent-soft text-accent-ink" aria-hidden="true"><ChefHat size={22} /></span>}
                <div className="min-w-0 flex-1">
                  <p className="type-caption text-muted">{t(`slots.${slot}`)}</p>
                  {food.kind === 'recipe' ? (
                    <Link to={`/recipes/${food.id}`} className="block truncate font-semibold text-ink hover:text-brand-ink">
                      {food.title}
                    </Link>
                  ) : (
                    <p className="truncate font-semibold text-ink">{food.title}</p>
                  )}
                  <p className="text-xs text-muted tabular">
                    {t('common.kcal', { value: formatKcal(food.kcal * entry.servings) })}
                    {entry.servings !== 1 && ` · ${t('common.servingsShort', { value: formatServings(entry.servings) })}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-muted">{t('home.today.empty')}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <Button to="/planner" variant={meals.length ? 'secondary' : 'primary'} size="sm">
            {meals.length ? t('home.today.open') : t('home.today.plan')}
          </Button>
        </div>
      </div>
    </section>
  );
}
