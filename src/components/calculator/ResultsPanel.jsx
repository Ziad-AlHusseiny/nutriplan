import { CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { activityById } from '../../data/activityLevels.js';
import { t } from '../../i18n/index.js';
import { formatNumber } from '../../lib/format.js';
import AnimatedNumber from '../ui/AnimatedNumber.jsx';
import Button from '../ui/Button.jsx';
import GoalPresets from './GoalPresets.jsx';

function Stat({ label, value, caption, testId, delay = 0 }) {
  return (
    <div className="pop-in rounded-xl border border-line bg-surface p-4" style={{ animationDelay: `${delay}ms` }}>
      <p className="type-caption text-muted">{label}</p>
      <p className="mt-1 type-stat text-ink">
        <AnimatedNumber value={value} from={0} data-testid={testId} />
      </p>
      <p className="text-sm text-muted">{caption}</p>
    </div>
  );
}

/**
 * BMR, TDEE, the goal and the daily target (PRD §7.3), with a protein-led
 * macro split, the safety notes, and "Save as planner target".
 */
export default function ResultsPanel({ results, goal, onGoal, target, macros, onSave, saved, stale }) {
  if (!results) {
    return (
      <div className="rounded-2xl border-[1.5px] border-dashed border-line p-6 text-center text-muted" data-testid="results-empty">
        {t('calculator.pre')}
      </div>
    );
  }
  const { profile } = results;
  return (
    <div className="space-y-5" data-testid="results">
      {stale && (
        <p className="flex gap-2 rounded-xl bg-accent-soft px-4 py-3 text-sm font-medium text-accent-ink" role="status">
          <Info aria-hidden="true" size={18} className="mt-0.5 shrink-0" />
          {t('calculator.stale')}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Stat label={t('calculator.bmr')} value={results.bmr} caption={t('calculator.bmrCaption')} testId="bmr" />
        <Stat label={t('calculator.tdee')} value={results.tdee} caption={t('calculator.tdeeCaption')} testId="tdee" delay={60} />
      </div>
      <div>
        <h3 id="goal-title" className="type-heading-sm text-ink">
          {t('calculator.pickGoal')}
        </h3>
        <div className="mt-3">
          <GoalPresets value={goal} onChange={onGoal} minor={target.minor} />
        </div>
      </div>
      <div className="rounded-xl border border-line bg-surface p-4">
        <p className="type-caption text-muted">{t('calculator.target')}</p>
        <p className="mt-1 type-stat text-accent-ink">
          <AnimatedNumber value={target.target} from={0} format={(n) => t('calculator.targetValue', { value: formatNumber(Math.round(n)) })} data-testid="target" />
        </p>
        <p className="mt-2 text-sm text-muted">{t('calculator.macrosTitle')}</p>
        <p className="text-sm font-semibold text-ink tabular" data-testid="macro-targets">
          {['protein', 'carbs', 'fat'].map((m) => `${t(`macros.${m}`)} ${formatNumber(macros[m])} ${t('units.g')}`).join(' · ')}
        </p>
        <p className="mt-1 text-xs text-muted">{t('calculator.proteinNote', { perKg: formatNumber(macros.perKg, { maximumFractionDigits: 1 }) })}</p>
      </div>
      {(target.floored || target.steep || target.minor) && (
        <div className="space-y-2" data-testid="safety-warnings">
          {target.minor && <Warning>{t('calculator.safety.minor')}</Warning>}
          {target.floored && <Warning>{t('calculator.safety.floored', { value: formatNumber(target.target) })}</Warning>}
          {target.steep && <Warning>{t('calculator.safety.steep')}</Warning>}
        </div>
      )}
      <div>
        <Button onClick={onSave} className="w-full" data-testid="save-target">
          {t('calculator.save')}
        </Button>
        <div aria-live="polite">
          {saved && (
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-medium text-brand-ink" data-testid="saved">
              <CircleCheck aria-hidden="true" size={18} />
              {t('calculator.saved', { value: formatNumber(saved) })}
              <Link to="/planner" className="font-semibold underline underline-offset-4">
                {t('calculator.openPlanner')}
              </Link>
            </p>
          )}
        </div>
      </div>
      <details className="rounded-xl bg-subtle p-4 text-sm">
        <summary className="font-semibold text-ink">{t('calculator.explain.title')}</summary>
        <div className="mt-3 space-y-2 text-muted">
          <p>{t('calculator.explain.bmr')}</p>
          <p className="rounded-md bg-surface px-3 py-2 font-mono text-ink tabular" dir="ltr">
            {t('calculator.explain.formula', {
              weight: formatNumber(profile.weightKg, { maximumFractionDigits: 1 }),
              height: formatNumber(profile.heightCm, { maximumFractionDigits: 1 }),
              age: profile.age,
              sexTerm: profile.sex === 'male' ? t('calculator.explain.sexMale') : t('calculator.explain.sexFemale'),
              bmr: formatNumber(results.bmr),
            })}
          </p>
          <p>{t('calculator.explain.tdee', { multiplier: activityById(profile.activity).multiplier, tdee: formatNumber(results.tdee) })}</p>
          <p>{t('calculator.explain.goal')}</p>
          <p>{t('calculator.explain.estimate')}</p>
        </div>
      </details>
    </div>
  );
}

function Warning({ children }) {
  return (
    <p className="flex gap-2 rounded-xl bg-accent-soft px-4 py-3 text-sm font-medium text-accent-ink">
      <TriangleAlert aria-hidden="true" size={18} className="mt-0.5 shrink-0" />
      {children}
    </p>
  );
}
