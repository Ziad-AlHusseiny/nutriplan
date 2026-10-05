import { CalendarPlus, Repeat2, ShoppingBasket, Sparkles, Trash2 } from 'lucide-react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import WeekBoard from '../components/planner/WeekBoard.jsx';
import WeekSummary from '../components/planner/WeekSummary.jsx';
import WeekSwitcher from '../components/planner/WeekSwitcher.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { usePlanWeek } from '../hooks/usePlanWeek.js';
import { useResolver } from '../hooks/useResolver.js';
import { useTargets } from '../hooks/useTargets.js';
import { t } from '../i18n/index.js';
import { formatKcal, formatNumber } from '../lib/format.js';
import { clearDay, clearWeek, copyDay, copyWeek, entriesOf, getWeek, moveEntry, removeEntry, removeIdEverywhere, replaceWeek, setEntry, setServings, weekHasMeals } from '../lib/plan.js';
import { mealsStore, planStore } from '../lib/stores.js';
import { focusSoon, slotControl } from '../lib/focus.js';
import { toast } from '../lib/toast.js';
import { addWeeks, todayIndex } from '../lib/week.js';

// The dialogs aren't needed for the first paint: their code loads right
// after the board, in its own chunk (outside the first-load budget).
const CopyDayDialog = lazy(() => import('../components/planner/CopyDayDialog.jsx'));
const CustomMealDialog = lazy(() => import('../components/planner/CustomMealDialog.jsx'));
const FillWeekDialog = lazy(() => import('../components/planner/FillWeekDialog.jsx'));
const MealSheet = lazy(() => import('../components/planner/MealSheet.jsx'));
const RecipePickerModal = lazy(() => import('../components/planner/RecipePickerModal.jsx'));
const TargetsDialog = lazy(() => import('../components/planner/TargetsDialog.jsx'));

/** /planner (PRD §6): header and targets → week actions → board → the week at a glance. */
export default function PlannerPage() {
  useDocumentTitle(t('meta.pages.planner.title'));
  const { hydrated, plan, key, thisWeek, week, setWeek, apply } = usePlanWeek();
  const targets = useTargets();
  const resolve = useResolver();
  const [picker, setPicker] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [copyFrom, setCopyFrom] = useState(null);
  const [filling, setFilling] = useState(false);
  const [editingTargets, setEditingTargets] = useState(false);
  const [mealDialog, setMealDialog] = useState(null);
  const picked = useRef(null);
  const mealFor = useRef(null);
  const fillBefore = useRef(null);

  const dayName = (d) => t(`days.${d}`);
  const titleOf = (entry) => (entry ? (resolve(entry.id)?.title ?? '') : '');
  const lastWeekCount = key ? entriesOf(getWeek(plan, addWeeks(key, -1))).length : 0;

  const handlers = {
    add: (day, slot) => {
      picked.current = null;
      setPicker({ day, slot });
    },
    remove: (day, slot, food) => {
      apply((p, k) => removeEntry(p, k, day, slot), t('planner.toast.removed', { title: food.title }));
      // The card is gone: focus moves to the slot's "+ Add meal".
      focusSoon(`[data-testid="slot-${day}-${slot}"] [data-testid="add-meal"]`);
    },
    edit: (day, slot) => setSheet({ day, slot }),
    move: (from, to) => {
      if (from.day === to.day && from.slot === to.slot) return;
      const a = titleOf(week[from.day][from.slot]);
      const b = titleOf(week[to.day][to.slot]);
      apply((p, k) => moveEntry(p, k, from, to), b ? t('planner.toast.swapped', { a, b }) : t('planner.toast.moved', { title: a }));
    },
    clear: (day) => {
      apply((p, k) => clearDay(p, k, day), t('planner.toast.cleared', { day: dayName(day) }));
      focusSoon(`#day-title-${day}`);
    },
    copy: (day) => setCopyFrom(day),
  };

  function select(id) {
    const { day, slot } = picker;
    picked.current = { day, slot };
    apply((p, k) => setEntry(p, k, day, slot, { id, servings: 1 }));
    setPicker(null);
  }

  // After picking, focus returns to the slot that was just filled (PRD §6.3).
  const focusSlot = () => {
    const at = picked.current;
    if (!at) return null;
    const slot = document.querySelector(`[data-testid="slot-${at.day}-${at.slot}"]`);
    return slot?.querySelector('a, button') ?? null;
  };

  function saveMeal(meal) {
    const forSlot = mealDialog?.forSlot;
    mealsStore.set((list) => (list.some((m) => m.id === meal.id) ? list.map((m) => (m.id === meal.id ? meal : m)) : [...list, meal]));
    if (forSlot) {
      apply((p, k) => setEntry(p, k, forSlot.day, forSlot.slot, { id: `custom:${meal.id}`, servings: 1 }), t('planner.toast.added', { title: meal.name, day: dayName(forSlot.day) }), { undo: false });
      focusSoon(slotControl(forSlot.day, forSlot.slot), { delay: 450 });
    }
    setMealDialog(null);
  }

  function deleteMeal(meal) {
    if (!window.confirm(t('meal.deleteConfirm', { name: meal.name }))) return;
    mealsStore.set((list) => list.filter((m) => m.id !== meal.id));
    planStore.set((p) => removeIdEverywhere(p, `custom:${meal.id}`));
    setMealDialog(null);
    setSheet(null);
  }

  // The banner is in the static HTML (most first visits have no plan); a
  // pre-paint script in index.html hides it for people who do, so it never
  // shifts the board either way.
  const empty = !weekHasMeals(week);
  useEffect(() => {
    // From here on React shows or hides the banner itself.
    if (hydrated) document.documentElement.classList.remove('has-week');
  }, [hydrated]);

  return (
    <div className="page-x pt-8 md:pt-12">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="type-display-lg text-ink">{t('planner.title')}</h1>
          <p className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="type-body-lg font-semibold text-ink" data-testid="target-row">
              {t('planner.target', { value: formatKcal(targets.kcal) })}
            </span>
            <Link to="/calculator" className="font-semibold text-brand-ink underline-offset-4 hover:underline">
              {t('planner.recalc')}
            </Link>
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted">
            <span>{['protein', 'carbs', 'fat'].map((m) => `${t(`macros.${m}`)} ${formatNumber(targets[m])} ${t('units.g')}`).join(' · ')}</span>
            <button type="button" onClick={() => setEditingTargets(true)} className="min-h-9 font-semibold text-brand-ink underline-offset-4 hover:underline" data-testid="edit-targets">
              {t('planner.editTargets')}
            </button>
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 lg:items-end">
          <WeekSwitcher weekKey={key} thisWeek={thisWeek} onChange={setWeek} />
          {/* Sunday evening is planning time: one tap to next week. */}
          {key && key === thisWeek && todayIndex(key) === 6 && (
            <button type="button" onClick={() => setWeek(addWeeks(thisWeek, 1))} className="min-h-11 rounded-full bg-accent-soft px-4 text-sm font-semibold text-accent-ink" data-testid="plan-next-week">
              {t('planner.planNext')}
            </button>
          )}
        </div>
      </header>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label={t('planner.actions')}>
        <Button onClick={() => setFilling(true)} disabled={!hydrated} data-testid="fill-open">
          <Sparkles aria-hidden="true" size={18} />
          {t('planner.fill')}
        </Button>
        <Button
          variant="secondary"
          disabled={!hydrated || !lastWeekCount}
          onClick={() => {
            const { copied } = copyWeek(planStore.get(), addWeeks(key, -1), key);
            if (!copied) toast(t('planner.toast.repeated', { count: 0 }));
            else apply((p, k) => copyWeek(p, addWeeks(k, -1), k).plan, t('planner.toast.repeated', { count: copied }));
          }}
          data-testid="repeat-week"
        >
          <Repeat2 aria-hidden="true" size={18} />
          {t('planner.repeat')}
        </Button>
        <Button to="/shopping" variant="secondary">
          <ShoppingBasket aria-hidden="true" size={18} />
          {t('planner.shoppingList')}
        </Button>
        {hydrated && !empty && (
          <Button
            variant="ghost"
            onClick={() => {
              apply((p, k) => clearWeek(p, k), t('planner.toast.clearedWeek'));
              focusSoon('[data-testid="fill-open"]');
            }}
            data-testid="clear-week"
          >
            <Trash2 aria-hidden="true" size={18} />
            {t('planner.clearWeek')}
          </Button>
        )}
      </div>

      {empty && (
        <div className="mt-6" data-empty-week>
          <EmptyState icon={CalendarPlus} title={t('planner.emptyBanner.title')} body={t('planner.emptyBanner.body')} actionLabel={t('planner.emptyBanner.action')} actionTo="/recipes" className="!py-8" />
        </div>
      )}

      <div className="mt-6">
        <WeekBoard weekKey={key} week={week} targets={targets} resolve={resolve} handlers={handlers} />
      </div>

      <div className="mt-8">
        <WeekSummary week={week} resolve={resolve} targets={targets} />
      </div>

      <Suspense fallback={null}>
      <RecipePickerModal
        open={Boolean(picker)}
        day={picker?.day}
        slot={picker?.slot}
        onSelect={select}
        onClose={() => setPicker(null)}
        returnFocus={focusSlot}
        onNewMeal={() => {
          const at = picker;
          mealFor.current = at;
          setPicker(null);
          setMealDialog({ forSlot: at });
        }}
      />
      <MealSheet
        open={Boolean(sheet)}
        at={sheet}
        week={week}
        resolve={resolve}
        onClose={() => setSheet(null)}
        onServings={(n) => apply((p, k) => setServings(p, k, sheet.day, sheet.slot, n))}
        onMove={(to) => {
          handlers.move(sheet, to);
          setSheet(null);
          // Follow the meal to its new slot once the sheet has closed.
          focusSoon(slotControl(to.day, to.slot), { delay: 350 });
        }}
        onRemove={() => {
          const food = resolve(week[sheet.day][sheet.slot].id);
          handlers.remove(sheet.day, sheet.slot, food);
          setSheet(null);
        }}
        onEditMeal={(meal) => {
          mealFor.current = sheet;
          setSheet(null);
          setMealDialog({ meal });
        }}
      />
      <CopyDayDialog
        open={Boolean(copyFrom)}
        day={copyFrom}
        onClose={() => setCopyFrom(null)}
        onCopy={(days) => {
          const from = copyFrom;
          apply((p, k) => copyDay(p, k, from, days), t('planner.toast.copied', { day: dayName(from), count: days.length }));
          setCopyFrom(null);
        }}
      />
      <FillWeekDialog
        open={filling}
        week={week}
        targets={targets}
        resolve={resolve}
        todayIdx={key ? todayIndex(key) : -1}
        onClose={() => setFilling(false)}
        onApply={(next) => {
          fillBefore.current = structuredClone(week);
          planStore.set((p) => replaceWeek(p, key, next));
        }}
        onUndo={() => {
          if (fillBefore.current) planStore.set((p) => replaceWeek(p, key, fillBefore.current));
        }}
      />
      <TargetsDialog open={editingTargets} targets={targets} onClose={() => setEditingTargets(false)} />
      <CustomMealDialog
        open={Boolean(mealDialog)}
        meal={mealDialog?.meal}
        onSave={saveMeal}
        onDelete={deleteMeal}
        onClose={() => setMealDialog(null)}
        returnFocus={() => (mealFor.current ? slotControl(mealFor.current.day, mealFor.current.slot)() : null)}
      />
      </Suspense>
    </div>
  );
}
