import { t } from '../../i18n/index.js';
import { formatKcal, formatNumber } from '../../lib/format.js';
import { weekSummary } from '../../lib/plan.js';

/** The week at a glance (BUILD-LOG): daily average against the targets, days on target, meals planned. */
export default function WeekSummary({ week, resolve, targets }) {
  const s = weekSummary(week, resolve, { kcal: targets.kcal });
  return (
    <section aria-labelledby="summary-title" className="rounded-2xl border border-line bg-surface p-4 shadow-card md:p-6" data-testid="week-summary">
      <h2 id="summary-title" className="type-heading-sm text-ink">
        {t('planner.summary.title')}
      </h2>
      {s.plannedDays === 0 ? (
        <p className="mt-2 text-muted">{t('planner.summary.none')}</p>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="type-caption text-muted">{t('planner.summary.average')}</p>
            <p className="mt-1 type-stat text-ink">{formatKcal(s.average.kcal)}</p>
            <p className="text-sm text-muted">{t('planner.total', { total: formatKcal(s.average.kcal), target: formatKcal(targets.kcal) })}</p>
          </div>
          {['protein', 'carbs', 'fat'].map((m) => {
            const avg = Math.round(s.average[m]);
            const pct = Math.min(100, (avg / targets[m]) * 100);
            return (
              <div key={m}>
                <p className="type-caption text-muted">{t(`macros.${m}`)}</p>
                <p className="mt-1 font-display text-2xl font-bold text-ink tabular">
                  {formatNumber(avg)} {t('units.g')}
                </p>
                <p className="text-sm text-muted">{t('planner.summary.avgOf', { value: formatNumber(avg), target: formatNumber(targets[m]) })}</p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
                  <div className={`h-full rounded-full ${m === 'protein' ? 'bg-protein' : m === 'carbs' ? 'bg-carbs' : 'bg-fat'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          <p className="text-sm font-medium text-ink sm:col-span-2 lg:col-span-4" data-testid="summary-on-target">
            {t('planner.summary.onTarget', { count: s.onTarget, total: s.plannedDays })} · {t('planner.summary.meals', { count: s.meals })}
          </p>
        </div>
      )}
    </section>
  );
}
