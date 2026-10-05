import { useCallback } from 'react';
import { t } from '../i18n/index.js';
import { getWeek, replaceWeek } from '../lib/plan.js';
import { weekSession, useSession } from '../lib/session.js';
import { planStore } from '../lib/stores.js';
import { dismissToastId, toast } from '../lib/toast.js';
import { weekKeyOf } from '../lib/week.js';
import { useHydrated } from './useMedia.js';
import { useStored } from './useStored.js';

let stopWatching = null;
function watchUntilChanged(toastId) {
  stopWatching?.();
  const off = planStore.subscribe(() => {
    dismissToastId(toastId);
    off();
    if (stopWatching === off) stopWatching = null;
  });
  stopWatching = off;
}

/**
 * The week on screen (shared by the planner and the shopping list) and an
 * `apply(op, message)` that changes it with an Undo toast. Before hydration
 * there's no "today" yet: the prerendered page shows an empty week.
 */
export function usePlanWeek() {
  const hydrated = useHydrated();
  const [plan] = useStored(planStore);
  const [selected, setSelected] = useSession(weekSession);
  const thisWeek = hydrated ? weekKeyOf(new Date()) : null;
  const key = selected ?? thisWeek;
  const week = key ? getWeek(plan, key) : getWeek({ weeks: {} }, '');

  const apply = useCallback(
    (op, message, { undo = true } = {}) => {
      if (!key) return;
      const before = structuredClone(getWeek(planStore.get(), key));
      planStore.set((p) => op(p, key));
      if (message) {
        const id = toast(message, undo ? { action: { label: t('common.undo'), onClick: () => planStore.set((p) => replaceWeek(p, key, before)) } } : undefined);
        // Undo puts the whole week back, so it's only offered until the
        // plan changes again (a pick, a servings tweak, another tab).
        if (undo) watchUntilChanged(id);
      }
    },
    [key],
  );

  return { hydrated, plan, key, thisWeek, week, setWeek: setSelected, apply };
}
