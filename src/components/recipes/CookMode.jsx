import { ChevronLeft, ChevronRight, ListChecks, Pause, Play, Sun, Timer, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ingredientLine, recipeSteps, recipeTitle } from '../../data/text.js';
import { useWakeLock, wakeLockSupported } from '../../hooks/useWakeLock.js';
import { t } from '../../i18n/index.js';
import { isRTL } from '../../i18n/state.js';
import { formatDuration } from '../../lib/duration.js';
import { pauseTimer, startTimer, timerFor, useTimers } from '../../lib/timers.js';
import Modal from '../ui/Modal.jsx';
import TimerList from './TimerList.jsx';

/**
 * Cook mode (BUILD-LOG): one step at a time in big type, full screen, the
 * screen kept awake (Screen Wake Lock), timers for timed steps with a chime,
 * the ingredients a tap away. Fully keyboard-operable: ← → steps (mirrored
 * in Arabic), Space or T starts/pauses the step's timer, I shows the
 * ingredients, Home/End jump, Esc exits.
 */
export default function CookMode({ recipe, open, onClose, servings, system }) {
  const steps = recipeSteps(recipe);
  const [index, setIndex] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  const finished = index >= steps.length;
  const step = steps[Math.min(index, steps.length - 1)];
  const timerId = `${recipe.id}:${index}`;
  useTimers();
  const timer = timerFor(timerId);
  const nextRef = useRef(null);
  useWakeLock(open);

  const go = (i) => setIndex(Math.max(0, Math.min(steps.length, i)));

  function toggleTimer() {
    if (finished || !step.timer) return;
    if (timer?.endsAt) pauseTimer(timerId);
    else startTimer({ id: timerId, recipeId: recipe.id, step: index, seconds: step.timer });
  }

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const tag = e.target.tagName;
      const onControl = tag === 'BUTTON' || tag === 'INPUT' || tag === 'A';
      const forward = isRTL() ? 'ArrowLeft' : 'ArrowRight';
      const back = isRTL() ? 'ArrowRight' : 'ArrowLeft';
      if (e.key === forward) {
        e.preventDefault();
        setIndex((i) => Math.min(steps.length, i + 1));
      } else if (e.key === back) {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setIndex(steps.length - 1);
      } else if (e.key === 'i' || e.key === 'I' || e.code === 'KeyI') {
        e.preventDefault();
        setShowIngredients((v) => !v);
      } else if (e.code === 'KeyT' || (e.key === ' ' && !onControl)) {
        e.preventDefault();
        document.getElementById('cook-timer-toggle')?.click();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, steps.length]);

  const title = recipeTitle(recipe);
  const Back = isRTL() ? ChevronRight : ChevronLeft;
  const Forward = isRTL() ? ChevronLeft : ChevronRight;
  const scale = servings / recipe.servings;

  return (
    <Modal open={open} onClose={onClose} title={t('cook.title', { title })} full initialFocus={nextRef} testId="cook-mode">
      <div className="flex h-full flex-col bg-page">
        <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3 md:px-8">
          <div className="min-w-0 flex-1">
            <p className="truncate font-display font-semibold text-ink">{title}</p>
            <p className="text-sm text-muted tabular" data-testid="cook-progress">
              {finished ? t('cook.finishedTitle') : t('cook.stepOf', { n: index + 1, total: steps.length })}
            </p>
          </div>
          <button type="button" onClick={() => setShowIngredients((v) => !v)} aria-pressed={showIngredients} aria-label={t('cook.ingredients')} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 font-semibold text-ink hover:border-brand" data-testid="cook-ingredients-toggle">
            <ListChecks aria-hidden="true" size={18} />
            <span className="hidden sm:inline" aria-hidden="true">
              {t('cook.ingredients')}
            </span>
          </button>
          <button type="button" onClick={onClose} className="grid size-11 place-items-center rounded-full text-ink hover:bg-subtle" aria-label={t('cook.exit')} data-testid="cook-exit">
            <X aria-hidden="true" size={24} />
          </button>
        </div>
        <div className="h-1.5 bg-line" role="progressbar" aria-label={t('cook.progress')} aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={Math.min(index + (finished ? 0 : 1), steps.length)}>
          <div className="h-full bg-brand transition-[width] duration-(--duration-panel) ease-(--ease-standard)" style={{ width: `${(Math.min(index + 1, steps.length) / steps.length) * 100}%` }} />
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col overflow-y-auto px-5 py-6 md:px-12 md:py-10">
            <div aria-live="polite" className="mx-auto w-full max-w-3xl flex-1">
              {finished ? (
                <div className="py-10 text-center">
                  <p className="type-display-lg text-ink">{t('cook.finishedTitle')}</p>
                  <p className="mt-3 type-body-lg text-muted">{t('cook.finishedBody')}</p>
                </div>
              ) : (
                <>
                  <p className="type-caption text-brand-ink">{t('cook.stepOf', { n: index + 1, total: steps.length })}</p>
                  <p key={index} className="pop-in mt-4 font-display text-[26px] leading-[1.35] font-semibold text-ink md:text-[36px]" data-testid="cook-step">
                    {step.text}
                  </p>
                </>
              )}
            </div>
            {!finished && step.timer && (
              <div className="mx-auto mt-8 w-full max-w-3xl">
                <button
                  id="cook-timer-toggle"
                  type="button"
                  onClick={toggleTimer}
                  disabled={timer?.done}
                  className="inline-flex min-h-14 items-center gap-3 rounded-full bg-accent-fill px-6 text-lg font-bold text-on-accent shadow-card transition-transform active:scale-95 disabled:opacity-60"
                  data-testid="cook-timer"
                >
                  {timer?.endsAt ? <Pause aria-hidden="true" size={22} /> : timer && !timer.done ? <Play aria-hidden="true" size={22} /> : <Timer aria-hidden="true" size={22} />}
                  {timer?.endsAt ? t('cook.pause') : timer && !timer.done ? t('cook.resume') : t('cook.startTimer', { duration: formatDuration(step.timer) })}
                </button>
              </div>
            )}
            <TimerList recipeId={recipe.id} large className="mx-auto mt-6 w-full max-w-3xl" />
            <p className="mx-auto mt-8 flex w-full max-w-3xl items-start gap-2 text-sm text-muted">
              <Sun aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
              {wakeLockSupported() ? t('cook.awake') : t('cook.notAwake')}
            </p>
            <p className="mx-auto mt-1 hidden w-full max-w-3xl text-sm text-muted md:block" aria-hidden="true">
              {t('cook.keys')}
            </p>
          </div>
          {showIngredients && (
            <aside className="absolute inset-x-0 bottom-[88px] top-[74px] z-10 overflow-y-auto border-t border-line bg-surface p-5 md:static md:w-[340px] md:border-s md:border-t-0" aria-label={t('cook.ingredients')} data-testid="cook-ingredients">
              <h3 className="type-heading-sm text-ink">{t('cook.ingredients')}</h3>
              <p className="text-sm text-muted">{t('common.servings', { count: servings })}</p>
              <ul className="mt-3 divide-y divide-line">
                {recipe.ingredients.map((ing) => (
                  <li key={ing.item} className="py-2.5 text-lg text-ink">
                    {ingredientLine(ing, { scale, system })}
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>

        <div className="flex gap-3 border-t border-line bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-8">
          <button type="button" onClick={() => go(index - 1)} disabled={index === 0} className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full border border-line text-lg font-semibold text-ink hover:border-brand disabled:opacity-45 md:flex-none md:px-8" data-testid="cook-prev">
            <Back aria-hidden="true" size={22} />
            {t('cook.prev')}
          </button>
          {finished ? (
            <>
              <button type="button" onClick={() => go(0)} className="inline-flex min-h-14 flex-1 items-center justify-center rounded-full border border-line text-lg font-semibold text-ink hover:border-brand md:ms-auto md:flex-none md:px-8">
                {t('cook.again')}
              </button>
              <button type="button" onClick={onClose} className="inline-flex min-h-14 flex-[2] items-center justify-center rounded-full bg-brand-fill text-lg font-bold text-on-brand md:flex-none md:px-10">
                {t('cook.backToRecipe')}
              </button>
            </>
          ) : (
            <button ref={nextRef} type="button" onClick={() => go(index + 1)} className="inline-flex min-h-14 flex-[2] items-center justify-center gap-2 rounded-full bg-brand-fill text-lg font-bold text-on-brand hover:bg-brand-fill-hover md:ms-auto md:flex-none md:px-10" data-testid="cook-next">
              {index === steps.length - 1 ? t('cook.finish') : t('cook.next')}
              <Forward aria-hidden="true" size={22} />
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
