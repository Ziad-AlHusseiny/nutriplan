// Kitchen timers for timed steps (cook mode and the recipe page). Kept by
// the wall clock (an end time, not a counter), so they stay right when the
// tab sleeps; several can run at once. When one finishes: a chime, a
// vibration on phones, and it stays on screen until dismissed.

import { useSyncExternalStore } from 'react';
import { playChime, primeAudio, scheduleChime } from './chime.js';

let timers = [];
const listeners = new Set();
let interval = null;
const emit = () => {
  timers = [...timers];
  listeners.forEach((fn) => fn());
};

// Clamped: a "now" a moment stale (the display's clock) never shows more than the timer's length.
export const remaining = (timer, now = Date.now()) => (timer.endsAt ? Math.min(timer.left, Math.max(0, timer.endsAt - now)) : timer.left);

function check() {
  const now = Date.now();
  let changed = false;
  for (const timer of timers) {
    if (timer.endsAt && !timer.done && timer.endsAt <= now) {
      timer.done = true;
      timer.endsAt = null;
      timer.left = 0;
      changed = true;
      // The chime was scheduled on the audio clock when the timer started;
      // ring it here only if that wasn't possible.
      if (!timer.cancelChime) playChime();
      timer.cancelChime = null;
      navigator.vibrate?.([250, 120, 250, 120, 250]);
    }
  }
  if (changed) emit();
  if (!timers.some((t) => t.endsAt)) {
    clearInterval(interval);
    interval = null;
  }
}

function ensureTicking() {
  if (!interval) interval = setInterval(check, 250);
}

if (typeof document !== 'undefined') document.addEventListener('visibilitychange', check);

/** Starts (or resumes) the timer for a step. */
export function startTimer({ id, recipeId, step, seconds }) {
  primeAudio();
  const existing = timers.find((t) => t.id === id);
  if (existing && !existing.done) {
    if (!existing.endsAt) {
      existing.endsAt = Date.now() + existing.left;
      existing.cancelChime = scheduleChime(existing.left / 1000);
    }
  } else {
    existing?.cancelChime?.();
    timers = timers.filter((t) => t.id !== id);
    timers.push({ id, recipeId, step, total: seconds * 1000, left: seconds * 1000, endsAt: Date.now() + seconds * 1000, done: false, cancelChime: scheduleChime(seconds) });
  }
  ensureTicking();
  emit();
}

export function pauseTimer(id) {
  const t = timers.find((x) => x.id === id);
  if (!t?.endsAt) return;
  t.left = Math.max(0, t.endsAt - Date.now());
  t.endsAt = null;
  t.cancelChime?.();
  t.cancelChime = null;
  emit();
}

export function resetTimer(id) {
  const t = timers.find((x) => x.id === id);
  if (!t) return;
  t.cancelChime?.();
  t.cancelChime = null;
  t.left = t.total;
  t.endsAt = null;
  t.done = false;
  emit();
}

export function dismissTimer(id) {
  timers.find((t) => t.id === id)?.cancelChime?.();
  timers = timers.filter((t) => t.id !== id);
  emit();
}

export const timerFor = (id) => timers.find((t) => t.id === id) ?? null;

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const EMPTY = [];
export const useTimers = () => useSyncExternalStore(subscribe, () => timers, () => EMPTY);

/** "4:05" / "1:02:30". */
export function clock(ms) {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
