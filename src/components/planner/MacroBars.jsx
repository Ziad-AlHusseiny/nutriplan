import { t } from '../../i18n/index.js';
import { formatNumber } from '../../lib/format.js';

const COLORS = { protein: 'bg-protein', carbs: 'bg-carbs', fat: 'bg-fat' };

/** A day's protein, carbs and fat against the targets: three slim bars with numbers. */
export default function MacroBars({ totals, targets }) {
  return (
    <ul className="grid gap-1.5" data-testid="macro-bars">
      {['protein', 'carbs', 'fat'].map((m) => {
        const value = Math.round(totals[m]);
        const pct = targets[m] ? Math.min(100, (value / targets[m]) * 100) : 0;
        return (
          <li key={m} aria-label={t('planner.macroBar', { macro: t(`macros.${m}`), value: formatNumber(value), target: formatNumber(targets[m]) })}>
            <div className="flex items-baseline justify-between gap-1 text-xs" aria-hidden="true">
              <span className="min-w-0 truncate font-semibold text-muted">{t(`macros.${m}`)}</span>
              <span className="shrink-0 whitespace-nowrap text-ink tabular">
                {formatNumber(value)}
                <span className="text-muted">
                  /{formatNumber(targets[m])} {t('units.g')}
                </span>
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
              <div className={`h-full rounded-full ${COLORS[m]} transition-[width] duration-(--duration-panel)`} style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
