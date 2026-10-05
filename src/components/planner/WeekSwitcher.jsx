import { ChevronLeft, ChevronRight } from 'lucide-react';
import { t } from '../../i18n/index.js';
import { isRTL } from '../../i18n/state.js';
import { formatDate } from '../../lib/format.js';
import { addWeeks, parseKey, weekDates } from '../../lib/week.js';

/** ‹ This week · Oct 5 – 11 › — shared by the planner and the shopping list. */
export default function WeekSwitcher({ weekKey, thisWeek, onChange }) {
  const name = !weekKey || weekKey === thisWeek ? t('week.this') : weekKey === addWeeks(thisWeek, 1) ? t('week.next') : weekKey === addWeeks(thisWeek, -1) ? t('week.last') : t('week.of', { date: formatDate(parseKey(weekKey), { day: 'numeric', month: 'short' }) });
  const dates = weekKey ? weekDates(weekKey) : null;
  const range = dates ? `${formatDate(dates[0], { day: 'numeric', month: 'short' })} – ${formatDate(dates[6], { day: 'numeric', month: 'short' })}` : ' ';
  const Prev = isRTL() ? ChevronRight : ChevronLeft;
  const Next = isRTL() ? ChevronLeft : ChevronRight;
  const btn = 'grid size-11 place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:border-brand disabled:opacity-45';
  return (
    <div className="flex items-center gap-2" data-testid="week-switcher">
      <button type="button" className={btn} disabled={!weekKey} onClick={() => onChange(addWeeks(weekKey, -1))} aria-label={t('week.prev')} data-testid="week-prev">
        <Prev aria-hidden="true" size={20} />
      </button>
      <div className="min-w-[9.5rem] text-center" aria-live="polite">
        <p className="font-display text-lg leading-6 font-bold text-ink" data-testid="week-name">
          {name}
        </p>
        <p className="text-xs text-muted tabular">{range}</p>
      </div>
      <button type="button" className={btn} disabled={!weekKey} onClick={() => onChange(addWeeks(weekKey, 1))} aria-label={t('week.nextBtn')} data-testid="week-next">
        <Next aria-hidden="true" size={20} />
      </button>
      {weekKey && thisWeek && weekKey !== thisWeek && (
        <button type="button" onClick={() => onChange(null)} className="ms-1 min-h-11 rounded-full px-3 text-sm font-semibold text-brand-ink hover:bg-subtle">
          {t('week.current')}
        </button>
      )}
    </div>
  );
}
