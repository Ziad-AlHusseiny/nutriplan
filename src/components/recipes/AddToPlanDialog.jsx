import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recipeTitle } from '../../data/text.js';
import { useResolver } from '../../hooks/useResolver.js';
import { useStored } from '../../hooks/useStored.js';
import { t } from '../../i18n/index.js';
import { getWeek, SERVINGS, setEntry } from '../../lib/plan.js';
import { planStore } from '../../lib/stores.js';
import { weekSession } from '../../lib/session.js';
import { toast } from '../../lib/toast.js';
import { addWeeks, DAYS, SLOTS, weekKeyOf } from '../../lib/week.js';
import Button from '../ui/Button.jsx';
import FilterChip from '../ui/FilterChip.jsx';
import Modal from '../ui/Modal.jsx';
import SegmentedControl from '../ui/SegmentedControl.jsx';
import Stepper from '../ui/Stepper.jsx';

/** The first empty slot this recipe suits, from today on (a sensible default). */
function firstFit(plan, recipe) {
  const now = new Date();
  const thisWeek = weekKeyOf(now);
  const today = (now.getDay() + 6) % 7;
  const slots = SLOTS.filter((s) => recipe.meals.includes(s));
  for (const [week, from] of [
    [thisWeek, today],
    [addWeeks(thisWeek, 1), 0],
  ]) {
    const w = getWeek(plan, week);
    for (let d = from; d < 7; d += 1) for (const s of slots) if (!w[DAYS[d]][s]) return { week, day: DAYS[d], slot: s };
  }
  return { week: thisWeek, day: DAYS[today], slot: slots[0] ?? 'dinner' };
}

/** "Add to planner" from a recipe page (BUILD-LOG): pick the week, day, meal and servings. */
export default function AddToPlanDialog({ recipe, open, onClose }) {
  const [plan] = useStored(planStore);
  const resolve = useResolver();
  const navigate = useNavigate();
  const [choice, setChoice] = useState(null);
  const thisWeek = weekKeyOf(new Date());
  const current = choice ?? { ...firstFit(plan, recipe), servings: 1 };
  const set = (patch) => setChoice({ ...current, ...patch });
  const taken = getWeek(plan, current.week)[current.day][current.slot];
  const takenTitle = taken ? resolve(taken.id)?.title : null;

  function add() {
    planStore.set((p) => setEntry(p, current.week, current.day, current.slot, { id: recipe.id, servings: current.servings }));
    onClose();
    setChoice(null);
    const week = current.week;
    toast(t('addToPlan.added', { day: t(`days.${current.day}`), slot: t(`slots.${current.slot}`) }), {
      action: {
        label: t('addToPlan.open'),
        // Open the planner on the week the meal went into.
        onClick: () => {
          weekSession.set(week === weekKeyOf(new Date()) ? null : week);
          navigate('/planner');
        },
      },
    });
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose();
        setChoice(null);
      }}
      title={t('addToPlan.title')}
      description={recipeTitle(recipe)}
      testId="add-to-plan"
      footer={
        <Button className="w-full" onClick={add} data-testid="add-to-plan-confirm">
          {t('addToPlan.add', { day: t(`days.${current.day}`), slot: t(`slots.${current.slot}`) })}
        </Button>
      }
    >
      <div className="space-y-6">
        <SegmentedControl
          legend={t('addToPlan.week')}
          value={current.week}
          onChange={(week) => set({ week })}
          options={[
            { value: thisWeek, label: t('week.this') },
            { value: addWeeks(thisWeek, 1), label: t('week.next') },
          ]}
        />
        <fieldset>
          <legend className="type-caption mb-2 text-muted">{t('addToPlan.day')}</legend>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => (
              <FilterChip key={d} label={t(`daysShort.${d}`)} aria-label={t(`days.${d}`)} selected={current.day === d} onToggle={() => set({ day: d })} />
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="type-caption mb-2 text-muted">{t('addToPlan.slot')}</legend>
          <div className="flex flex-wrap gap-2">
            {SLOTS.map((s) => (
              <FilterChip key={s} label={t(`slots.${s}`)} selected={current.slot === s} onToggle={() => set({ slot: s })} />
            ))}
          </div>
          {takenTitle && <p className="mt-2 text-sm text-accent-ink">{t('addToPlan.replaces', { title: takenTitle })}</p>}
        </fieldset>
        <div className="flex items-center justify-between gap-4">
          <span className="type-caption text-muted">{t('addToPlan.servings')}</span>
          <Stepper value={current.servings} min={SERVINGS.min} max={SERVINGS.max} step={SERVINGS.step} onChange={(servings) => set({ servings })} decreaseLabel={t('recipe.decrease')} increaseLabel={t('recipe.increase')} label={t('addToPlan.servings')} />
        </div>
      </div>
    </Modal>
  );
}
