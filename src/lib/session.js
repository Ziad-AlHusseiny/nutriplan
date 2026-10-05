// In-memory state that should survive moving between pages (not reloads):
// the recipe filters while you open a recipe and come back, and the week
// you're looking at in the planner and the shopping list.

import { useSyncExternalStore } from 'react';
import { DEFAULT_FILTERS } from './filters.js';

function memoryStore(initial) {
  let value = initial;
  const listeners = new Set();
  return {
    get: () => value,
    getServer: () => initial,
    set(next) {
      value = typeof next === 'function' ? next(value) : next;
      listeners.forEach((fn) => fn());
    },
    reset() {
      value = initial;
      listeners.forEach((fn) => fn());
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

export const filtersSession = memoryStore({ ...DEFAULT_FILTERS });
export const querySession = memoryStore('');
/** The week shown by the planner and the shopping list (null = this week). */
export const weekSession = memoryStore(null);

export function useSession(store) {
  return [useSyncExternalStore(store.subscribe, store.get, store.getServer), store.set];
}
