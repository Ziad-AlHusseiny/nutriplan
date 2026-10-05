import { t } from '../../i18n/index.js';
import { formatKcal, formatNumber } from '../../lib/format.js';

/**
 * "1,450 / 2,000 kcal" over a progress track (PRD §6.2). Green up to the
 * target; past it the fill turns red and "220 kcal over" appears (color is
 * never the only signal). Width animates 400ms.
 */
export default function DayCalorieBar({ total, target, dayLabel }) {
  const over = Math.round(total - target);
  const isOver = over > 0;
  const pct = target ? Math.min(100, (total / target) * 100) : 0;
  return (
    <div data-testid="day-bar" data-over={isOver || undefined}>
      <p className="text-sm font-semibold text-ink tabular">{t('planner.total', { total: formatKcal(total), target: formatKcal(target) })}</p>
      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={Math.round(total)}
        aria-valuetext={t('planner.barLabel', { day: dayLabel, total: formatNumber(Math.round(total)), target: formatNumber(target) })}
        aria-label={dayLabel}
      >
        <div className={`h-full rounded-full transition-[width,background-color] duration-(--duration-panel) ease-(--ease-standard) ${isOver ? 'bg-danger' : 'bg-brand'}`} style={{ width: `${pct}%` }} />
      </div>
      {isOver && (
        <p className="mt-1 text-xs font-semibold text-danger-ink" data-testid="over-caption">
          {t('planner.over', { value: formatKcal(over) })}
        </p>
      )}
    </div>
  );
}
