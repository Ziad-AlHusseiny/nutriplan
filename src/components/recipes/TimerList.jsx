import { BellRing, Pause, Play, RotateCcw, X } from 'lucide-react';
import { useNow } from '../../hooks/useNow.js';
import { t } from '../../i18n/index.js';
import { isolate } from '../../i18n/state.js';
import { clock, dismissTimer, pauseTimer, remaining, resetTimer, startTimer, useTimers } from '../../lib/timers.js';

/**
 * The running and finished timers for a recipe, with pause / resume,
 * reset and dismiss. `large` is cook mode's size.
 */
export default function TimerList({ recipeId, large = false, className = '' }) {
  const timers = useTimers().filter((x) => x.recipeId === recipeId);
  const now = useNow(timers.some((x) => x.endsAt), 250);
  if (!timers.length) return null;
  const btn = `grid ${large ? 'size-12' : 'size-10'} place-items-center rounded-full transition-colors hover:bg-subtle`;
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`} aria-label={t('cook.timers')} data-testid="timer-list">
      {timers.map((timer) => {
        const left = remaining(timer, now);
        const name = t('cook.timerName', { n: timer.step + 1 });
        return (
          <li
            key={timer.id}
            className={`flex items-center gap-1 rounded-full border py-1 ps-4 pe-1 ${timer.done ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line bg-surface text-ink'} ${large ? 'text-lg' : ''}`}
            data-testid="timer"
            data-done={timer.done || undefined}
          >
            {timer.done ? <BellRing aria-hidden="true" size={large ? 22 : 18} className="motion-safe:animate-bounce" /> : null}
            <span className="font-semibold">{timer.done ? t('cook.timerDone', { n: timer.step + 1 }) : name}</span>
            {!timer.done && (
              <span className="ms-1 font-display font-bold tabular" role="timer" aria-label={t('cook.timerRunning', { name, time: clock(left) })}>
                {isolate(clock(left))}
              </span>
            )}
            {!timer.done &&
              (timer.endsAt ? (
                <button type="button" className={btn} onClick={() => pauseTimer(timer.id)} aria-label={`${t('cook.pause')}: ${name}`}>
                  <Pause aria-hidden="true" size={18} />
                </button>
              ) : (
                <button type="button" className={btn} onClick={() => startTimer({ id: timer.id, recipeId, step: timer.step, seconds: timer.total / 1000 })} aria-label={`${t('cook.resume')}: ${name}`}>
                  <Play aria-hidden="true" size={18} />
                </button>
              ))}
            {!timer.done && (
              <button type="button" className={btn} onClick={() => resetTimer(timer.id)} aria-label={`${t('cook.reset')}: ${name}`}>
                <RotateCcw aria-hidden="true" size={18} />
              </button>
            )}
            <button type="button" className={btn} onClick={() => dismissTimer(timer.id)} aria-label={`${timer.done ? t('cook.dismiss') : t('cook.stop')}: ${name}`} data-testid="timer-dismiss">
              <X aria-hidden="true" size={18} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
