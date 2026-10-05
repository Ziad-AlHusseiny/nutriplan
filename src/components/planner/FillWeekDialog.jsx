import { CircleCheck, Info, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { recipeById, recipes } from '../../data/recipes.js';
import { recipeTitle } from '../../data/text.js';
import { useFavorites } from '../../hooks/useFavorites.js';
import { useStored } from '../../hooks/useStored.js';
import { list, t } from '../../i18n/index.js';
import { DEFAULT_TOLERANCE, fillWeek } from '../../lib/autoplan.js';
import { formatKcal, formatList, formatServings } from '../../lib/format.js';
import { autoplanStore } from '../../lib/stores.js';
import { DAYS, SLOTS } from '../../lib/week.js';
import Button from '../ui/Button.jsx';
import FilterChip from '../ui/FilterChip.jsx';
import Modal from '../ui/Modal.jsx';

/**
 * "Fill my week" (BUILD-LOG): choose diets and slots, see the rules, fill
 * the empty slots, then read exactly what was picked and why: keep it or
 * undo it.
 */
export default function FillWeekDialog({ open, week, targets, resolve, todayIdx, onApply, onUndo, onClose }) {
  const [prefs, setPrefs] = useStored(autoplanStore);
  const [skipPast, setSkipPast] = useState(true);
  const [favorites] = useFavorites();
  const [result, setResult] = useState(null);
  const toggle = (key, value) => setPrefs((p) => ({ ...p, [key]: p[key].includes(value) ? p[key].filter((x) => x !== value) : [...p[key], value] }));
  const days = todayIdx > 0 && skipPast ? DAYS.slice(todayIdx) : DAYS;
  const restrictions = prefs.diets.filter((d) => d !== 'high-protein');

  function run() {
    const res = fillWeek({ week, recipes, resolve, targets, diets: prefs.diets, favorites, days, slots: prefs.slots.length ? prefs.slots : SLOTS, tolerance: DEFAULT_TOLERANCE });
    onApply(res.week, res.filled.length);
    setResult(res);
  }
  function close() {
    setResult(null);
    onClose();
  }

  return (
    <Modal open={open} onClose={close} title={result ? t('fill.result.title') : t('fill.title')} size="lg" testId="fill-dialog" footer={
      result ? (
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => { onUndo(); close(); }} data-testid="fill-undo">
            {t('fill.result.undo')}
          </Button>
          <Button className="flex-[2]" onClick={close} data-testid="fill-keep">
            {t('fill.result.keep')}
          </Button>
        </div>
      ) : (
        <Button className="w-full" onClick={run} data-testid="fill-run">
          <Sparkles aria-hidden="true" size={18} />
          {t('fill.action')}
        </Button>
      )
    }>
      {!result ? (
        <div className="space-y-6">
          <p className="text-ink">{t('fill.intro', { kcal: formatKcal(targets.kcal), tolerance: Math.round(DEFAULT_TOLERANCE * 100) })}</p>
          <fieldset>
            <legend className="type-caption mb-2 text-muted">{t('fill.diets')}</legend>
            <div className="flex flex-wrap gap-2">
              {['vegan', 'vegetarian', 'keto'].map((d) => (
                <FilterChip key={d} label={t(`diets.${d}`)} selected={prefs.diets.includes(d)} onToggle={() => toggle('diets', d)} data-testid={`fill-diet-${d}`} />
              ))}
              <FilterChip label={t('fill.preferProtein')} tone="orange" selected={prefs.diets.includes('high-protein')} onToggle={() => toggle('diets', 'high-protein')} data-testid="fill-diet-high-protein" />
            </div>
            {restrictions.length > 0 && <p className="mt-2 text-sm text-muted">{t('fill.dietHint', { diets: formatList(restrictions.map((d) => t(`diets.${d}`).toLowerCase())) })}</p>}
          </fieldset>
          <fieldset>
            <legend className="type-caption mb-2 text-muted">{t('fill.slots')}</legend>
            <div className="flex flex-wrap gap-2">
              {SLOTS.map((s) => (
                <FilterChip key={s} label={t(`slots.${s}`)} selected={prefs.slots.includes(s)} onToggle={() => toggle('slots', s)} data-testid={`fill-slot-${s}`} />
              ))}
            </div>
          </fieldset>
          {todayIdx > 0 && (
            <label className="flex min-h-11 items-center gap-3 font-medium text-ink">
              <input type="checkbox" className="size-5 accent-(--color-brand-fill)" checked={skipPast} onChange={(e) => setSkipPast(e.target.checked)} />
              {t('fill.skipPast')}
            </label>
          )}
          <details className="rounded-xl bg-subtle p-4">
            <summary className="flex min-h-6 items-center gap-2 font-semibold text-ink">
              <Info aria-hidden="true" size={18} className="text-brand-ink" />
              {t('fill.rules.title')}
            </summary>
            <ol className="mt-3 list-decimal space-y-1.5 ps-5 text-sm text-muted">
              {list('fill.rules.items').map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ol>
          </details>
        </div>
      ) : (
        <div className="space-y-5" data-testid="fill-result">
          <p className="font-semibold text-ink">{t('planner.toast.filled', { count: result.filled.length })}</p>
          {result.relaxed.length > 0 && <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent-ink">{t('fill.result.relaxed', { slots: formatList(result.relaxed.map((s) => t(`slots.${s}`).toLowerCase())) })}</p>}
          {result.unfilled.some((u) => u.reason === 'day-full') && <p className="text-sm text-muted">{t('fill.result.unfilled', { count: result.unfilled.filter((u) => u.reason === 'day-full').length })}</p>}
          {[...new Set(result.unfilled.filter((u) => u.reason === 'no-recipes').map((u) => u.slot))].map((slot) => (
            <p key={slot} className="text-sm text-muted">
              {t('fill.result.noRecipes', { slot: t(`slots.${slot}`).toLowerCase() })}
            </p>
          ))}
          <ul className="space-y-3">
            {result.days.map((d) => {
              const picks = result.filled.filter((f) => f.day === d.day);
              return (
                <li key={d.day} className="rounded-xl border border-line p-3">
                  <p className={`flex items-center gap-2 font-semibold ${d.within ? 'text-brand-ink' : 'text-accent-ink'}`}>
                    {d.within && <CircleCheck aria-hidden="true" size={18} />}
                    {t(d.within ? 'fill.result.dayOn' : 'fill.result.dayOff', { day: t(`days.${d.day}`), kcal: formatKcal(d.kcal) })}
                  </p>
                  {picks.length > 0 && (
                    <ul className="mt-1.5 space-y-1 text-sm text-muted">
                      {picks.map((f) => (
                        <li key={f.slot}>
                          {t('fill.result.line', {
                            slot: t(`slots.${f.slot}`),
                            aim: formatKcal(f.aim),
                            title: recipeTitle(recipeById.get(f.id)),
                            servings: t('common.servingsShort', { value: formatServings(f.servings) }),
                            kcal: formatKcal(f.kcal),
                          })}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Modal>
  );
}
