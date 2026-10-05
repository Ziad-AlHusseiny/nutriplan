import { Copy } from 'lucide-react';
import { t } from '../../i18n/index.js';
import { formatDate } from '../../lib/format.js';
import { SLOTS } from '../../lib/week.js';
import Button from '../ui/Button.jsx';
import DayCalorieBar from './DayCalorieBar.jsx';
import MacroBars from './MacroBars.jsx';
import MealSlot from './MealSlot.jsx';

/** A day (PRD §6.2): name and date, Clear day, the calorie bar, macros, and four slots. */
export default function DayColumn({ day, date, isToday, meals, totals, targets, resolve, onAdd, onRemove, onEdit, onMove, onClear, onCopy }) {
  const name = t(`days.${day}`);
  const count = SLOTS.filter((s) => meals[s] && resolve(meals[s].id)).length;
  return (
    <section
      id={`day-${day}`}
      aria-labelledby={`day-title-${day}`}
      className={`flex flex-col gap-3 rounded-xl border bg-surface p-3 shadow-card ${isToday ? 'border-brand ring-1 ring-brand' : 'border-line'}`}
      data-testid={`day-${day}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
        <div className="shrink-0">
          <h2 id={`day-title-${day}`} tabIndex={-1} className="font-display text-xl leading-7 font-bold text-ink outline-none">
            {name}
          </h2>
          <p className="flex items-center gap-1.5 text-xs font-medium whitespace-nowrap text-muted">
            {date ? formatDate(date, { day: 'numeric', month: 'short' }) : '\u00a0'}
            {isToday && <span className="rounded-full bg-brand-soft px-2 py-px font-bold text-brand-ink">{t('week.today')}</span>}
          </p>
        </div>
        {count > 0 && (
          <div className="-me-1 ms-auto flex items-center">
            <button type="button" onClick={onCopy} className="grid size-9 place-items-center rounded-full text-muted hover:bg-subtle hover:text-ink" aria-label={t('planner.copyDayLabel', { day: name })} data-testid="copy-day">
              <Copy aria-hidden="true" size={16} />
            </button>
            <Button variant="ghost" size="sm" className="!px-2.5" onClick={onClear} data-testid="clear-day">
              {t('planner.clearDay')}
            </Button>
          </div>
        )}
      </div>
      <DayCalorieBar total={totals.kcal} target={targets.kcal} dayLabel={name} />
      <MacroBars totals={totals} targets={targets} />
      <div className="flex flex-col gap-3">
        {SLOTS.map((slot, i) => {
          const entry = meals[slot];
          const food = entry ? resolve(entry.id) : null;
          return (
            <MealSlot
              key={slot}
              day={day}
              slot={slot}
              index={i}
              entry={food ? entry : null}
              food={food}
              dayLabel={name}
              onAdd={() => onAdd(slot)}
              onRemove={() => onRemove(slot, food)}
              onEdit={() => onEdit(slot)}
              onMove={onMove}
            />
          );
        })}
      </div>
    </section>
  );
}
