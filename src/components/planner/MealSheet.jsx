import { ArrowLeftRight, ChefHat, PencilLine, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { t } from '../../i18n/index.js';
import { formatKcal, formatNumber } from '../../lib/format.js';
import { SERVINGS } from '../../lib/plan.js';
import { DAYS, SLOTS } from '../../lib/week.js';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import Stepper from '../ui/Stepper.jsx';

/**
 * A planned meal's sheet: servings for this slot, move or swap to any
 * other slot of the week (the keyboard-friendly way to rearrange), open
 * the recipe, edit your own meal, or remove it.
 */
export default function MealSheet({ open, at, week, resolve, onClose, onServings, onMove, onRemove, onEditMeal }) {
  const entry = at ? week[at.day][at.slot] : null;
  const food = entry ? resolve(entry.id) : null;
  const n = entry?.servings ?? 1;
  return (
    <Modal open={open && Boolean(food)} onClose={onClose} title={food?.title ?? ''} description={at ? `${t(`days.${at.day}`)} · ${t(`slots.${at.slot}`)}` : ''} testId="meal-sheet">
      {food && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-subtle p-4">
            <div>
              <p className="font-display text-2xl font-bold text-ink tabular">{t('common.kcal', { value: formatKcal(food.kcal * n) })}</p>
              <p className="text-sm text-muted tabular">
                {['protein', 'carbs', 'fat'].map((m) => `${t(`macros.${m}`)} ${formatNumber(Math.round(food[m] * n))} ${t('units.g')}`).join(' · ')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="type-caption text-muted">{t('addToPlan.servings')}</span>
              <Stepper value={n} min={SERVINGS.min} max={SERVINGS.max} step={SERVINGS.step} onChange={onServings} decreaseLabel={t('recipe.decrease')} increaseLabel={t('recipe.increase')} label={t('addToPlan.servings')} size="sm" testId="sheet-servings" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {food.kind === 'recipe' ? (
              <Button to={`/recipes/${food.id}`} variant="secondary" size="sm">
                <ChefHat aria-hidden="true" size={16} />
                {t('recipe.cook')}
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => onEditMeal(food.meal)}>
                <PencilLine aria-hidden="true" size={16} />
                {t('common.edit')}
              </Button>
            )}
            <Button variant="danger" size="sm" onClick={onRemove} data-testid="sheet-remove">
              <Trash2 aria-hidden="true" size={16} />
              {t('common.delete')}
            </Button>
          </div>

          <section aria-labelledby="move-title">
            <h3 id="move-title" className="flex items-center gap-2 font-semibold text-ink">
              <ArrowLeftRight aria-hidden="true" size={18} className="text-brand-ink" />
              {t('move.title', { title: food.title })}
            </h3>
            <p className="mt-1 text-sm text-muted">{t('move.intro')}</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[480px] border-separate border-spacing-1 text-sm">
                <thead>
                  <tr>
                    <th scope="col" className="sr-only">
                      {t('addToPlan.day')}
                    </th>
                    {SLOTS.map((s) => (
                      <th key={s} scope="col" className="type-caption px-1 text-start font-semibold text-muted">
                        {t(`slots.${s}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((d) => (
                    <tr key={d}>
                      <th scope="row" className="pe-2 text-start font-semibold text-ink">
                        {t(`daysShort.${d}`)}
                      </th>
                      {SLOTS.map((s) => {
                        const here = at.day === d && at.slot === s;
                        const other = week[d][s] ? resolve(week[d][s].id) : null;
                        const label = here ? t('move.current') : other ? t('move.swap', { title: other.title, day: t(`days.${d}`), slot: t(`slots.${s}`) }) : t('move.here', { day: t(`days.${d}`), slot: t(`slots.${s}`) });
                        return (
                          <td key={s}>
                            <button
                              type="button"
                              disabled={here}
                              onClick={() => onMove({ day: d, slot: s })}
                              aria-label={label}
                              title={label}
                              className={`block h-10 w-full truncate rounded-md border px-2 text-start text-xs transition-colors ${here ? 'border-brand bg-brand-soft font-bold text-brand-ink' : other ? 'border-line bg-surface text-ink hover:border-brand' : 'border-dashed border-line text-muted hover:border-brand hover:text-brand-ink'}`}
                              data-testid={`move-${d}-${s}`}
                            >
                              {here ? '●' : other ? other.title : '+'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </Modal>
  );
}
