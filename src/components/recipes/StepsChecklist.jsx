import { Check, Timer } from 'lucide-react';
import { useState } from 'react';
import { recipeSteps } from '../../data/text.js';
import { t } from '../../i18n/index.js';
import { formatDuration } from '../../lib/duration.js';
import { startTimer, useTimers } from '../../lib/timers.js';

/**
 * Numbered method with real checkboxes (PRD §5.4): a checked step gets a
 * green check, a filled badge, and dimmed struck-through text. Per visit,
 * not saved. Timed steps can start their timer right here too.
 */
export default function StepsChecklist({ recipe }) {
  const steps = recipeSteps(recipe);
  const [done, setDone] = useState(() => new Set());
  const timers = useTimers();
  const toggle = (i) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <section aria-labelledby="method-title" className="rounded-2xl border border-line bg-surface p-4 shadow-card md:p-6">
      <h2 id="method-title" className="type-heading-md text-ink">
        {t('recipe.method')}
      </h2>
      <p className="mt-2 text-sm font-semibold text-muted" aria-live="polite" data-testid="steps-progress">
        {t('recipe.stepsDone', { done: done.size, total: steps.length })}
      </p>
      <ol className="mt-4 space-y-2">
        {steps.map((step, i) => {
          const checked = done.has(i);
          const id = `step-${recipe.id}-${i}`;
          const timerId = `${recipe.id}:${i}`;
          const running = timers.some((x) => x.id === timerId);
          return (
            <li key={i} className={`rounded-xl transition-colors duration-(--duration-ui) ${checked ? 'bg-subtle' : ''}`}>
              <div className="flex gap-3 p-2">
                <input id={id} type="checkbox" className="peer sr-only" checked={checked} onChange={() => toggle(i)} data-testid="step-checkbox" />
                <label htmlFor={id} data-testid="step-label" className="flex min-h-11 flex-1 cursor-pointer gap-3 rounded-lg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand">
                  <span aria-hidden="true" className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors duration-(--duration-ui) ${checked ? 'bg-brand-fill text-on-brand' : 'border border-line bg-surface text-ink'}`}>
                    {checked ? <Check size={16} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={`pt-0.5 transition-colors ${checked ? 'text-muted line-through decoration-muted/60' : 'text-ink'}`}>
                    <span className="sr-only">{i + 1}. </span>
                    {step.text}
                  </span>
                </label>
              </div>
              {step.timer && !checked && (
                <div className="ps-14 pb-2">
                  <button
                    type="button"
                    onClick={() => startTimer({ id: timerId, recipeId: recipe.id, step: i, seconds: step.timer })}
                    disabled={running}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line px-3 text-sm font-semibold text-brand-ink transition-colors hover:border-brand disabled:opacity-60"
                    data-testid="step-timer"
                  >
                    <Timer aria-hidden="true" size={16} />
                    {t('cook.startTimer', { duration: formatDuration(step.timer) })}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
