import { AnimatePresence, m } from 'motion/react';
import { useState } from 'react';
import { t } from '../../i18n/index.js';
import { SPRING, useMotionReady } from '../../lib/motion.js';
import { isSettled } from '../../lib/settled.js';
import PlannedMealCard from './PlannedMealCard.jsx';

/**
 * One slot (PRD §6.2): "+ Add meal" when empty, the planned card when
 * filled. Cards spring in and fade out (staggered on "Clear day"); a card
 * dragged here moves (or swaps) with a mouse.
 */
export default function MealSlot({ day, slot, index, entry, food, dayLabel, onAdd, onRemove, onEdit, onMove }) {
  const [over, setOver] = useState(false);
  const motionReady = useMotionReady();
  const slotLabel = t(`slots.${slot}`);
  const filled = Boolean(entry && food);
  const card = filled ? (
    <PlannedMealCard
      food={food}
      entry={entry}
      dayLabel={dayLabel}
      slotLabel={slotLabel}
      onRemove={onRemove}
      onEdit={onEdit}
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-nutriplan', JSON.stringify({ day, slot }));
        e.dataTransfer.effectAllowed = 'move';
      }}
    />
  ) : null;
  const add = (
    <button
      type="button"
      onClick={onAdd}
      className="flex min-h-12 w-full items-center justify-center rounded-xl border-[1.5px] border-dashed border-line text-sm font-semibold text-muted transition-colors hover:border-brand hover:text-brand-ink"
      aria-label={t('planner.addMealTo', { day: dayLabel, slot: slotLabel.toLowerCase() })}
      data-testid="add-meal"
      data-slot={`${day}-${slot}`}
    >
      {t('planner.addMeal')}
    </button>
  );
  return (
    <div
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes('application/x-nutriplan')) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        setOver(false);
        const raw = e.dataTransfer.getData('application/x-nutriplan');
        if (!raw) return;
        e.preventDefault();
        onMove(JSON.parse(raw), { day, slot });
      }}
      className={`rounded-xl transition-[box-shadow] ${over ? 'ring-2 ring-brand ring-offset-2 ring-offset-surface' : ''}`}
      data-testid={`slot-${day}-${slot}`}
    >
      <p className="type-caption mb-1.5 text-muted">{slotLabel}</p>
      {motionReady ? (
        <AnimatePresence mode="wait" initial={false} custom={index}>
          {filled ? (
            <m.div
              key={entry.id}
              initial={isSettled() ? { opacity: 0, scale: 0.9 } : false}
              animate={{ opacity: 1, scale: 1, transition: SPRING }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25, delay: index * 0.06 } }}
            >
              {card}
            </m.div>
          ) : (
            <m.div key="empty" initial={isSettled() ? { opacity: 0 } : false} animate={{ opacity: 1, transition: { duration: 0.15 } }} exit={{ opacity: 0, transition: { duration: 0.1 } }}>
              {add}
            </m.div>
          )}
        </AnimatePresence>
      ) : (
        <div>{filled ? card : add}</div>
      )}
    </div>
  );
}
