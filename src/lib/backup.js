// Your data, in your hands: a JSON backup of everything NutriPlan saved, a
// restore that merges (never wipes), and "delete everything".

import { emptyPlan, getWeek, validatePlan } from './plan.js';
import { allStores, readRaw, savedKeys, writeRaw } from './storage.js';
import { favoritesStore, knownRecipe, mealsStore, pantryStore, planStore, shoppingStore, validMeal, validShopping } from './stores.js';
import { DAYS, SLOTS } from './week.js';

export const BACKUP_APP = 'nutriplan';

export function buildBackup(now = new Date()) {
  const data = {};
  for (const key of savedKeys()) {
    try {
      data[key] = JSON.parse(readRaw(key));
    } catch {
      // Skip anything unreadable.
    }
  }
  return { app: BACKUP_APP, version: 1, exportedAt: now.toISOString(), data };
}

/**
 * Restores a backup. Plans merge slot by slot (your current meals win),
 * your own meals, favorites, pantry and shopping ticks merge; targets and
 * settings are replaced. Throws if the file isn't a NutriPlan backup.
 */
export function restoreBackup(backup) {
  if (!backup || backup.app !== BACKUP_APP || typeof backup.data !== 'object' || backup.data === null || Array.isArray(backup.data)) {
    throw new Error('not-a-backup');
  }
  const { data } = backup;
  const merged = new Set(['plan', 'meals', 'favorites', 'pantry', 'shopping']);

  if (data.plan) {
    const incoming = validatePlan(data.plan, { knownRecipe });
    if (incoming) {
      planStore.set((stored) => {
        const current = validatePlan(stored, { knownRecipe }) ?? emptyPlan();
        const weeks = structuredClone(current.weeks);
        for (const [key, week] of Object.entries(incoming.weeks)) {
          const mine = getWeek(current, key);
          const out = structuredClone(mine);
          for (const d of DAYS) for (const s of SLOTS) if (!out[d][s] && week[d][s]) out[d][s] = week[d][s];
          weeks[key] = out;
        }
        return validatePlan({ version: 2, weeks }, { knownRecipe });
      });
    }
  }
  if (Array.isArray(data.meals)) {
    mealsStore.set((current) => {
      const ids = new Set(current.map((m) => m.id));
      return [...current, ...data.meals.filter(validMeal).filter((m) => !ids.has(m.id))].slice(0, 200);
    });
  }
  if (Array.isArray(data.favorites)) favoritesStore.set((current) => [...new Set([...current, ...data.favorites.filter(knownRecipe)])]);
  if (Array.isArray(data.pantry)) pantryStore.set((current) => [...new Set([...current, ...data.pantry.filter((k) => typeof k === 'string' && /^[a-z-]{1,40}$/.test(k))])]);
  if (data.shopping) {
    const incoming = validShopping(data.shopping);
    if (incoming) {
      shoppingStore.set((current) => {
        const weeks = { ...current.weeks };
        for (const [key, w] of Object.entries(incoming.weeks)) {
          const mine = weeks[key] ?? { checked: [], extras: [] };
          const ids = new Set(mine.extras.map((e) => e.id));
          weeks[key] = { ...mine, checked: [...new Set([...mine.checked, ...w.checked])], extras: [...mine.extras, ...w.extras.filter((e) => !ids.has(e.id))] };
        }
        return validShopping({ weeks });
      });
    }
  }
  for (const store of allStores()) {
    if (merged.has(store.key) || !Object.hasOwn(data, store.key)) continue;
    // Written raw, then re-read through the store's validator, so nothing
    // malformed ever reaches the app.
    writeRaw(store.key, JSON.stringify(data[store.key]));
    store.reload();
  }
}

/** Saves text as a file (no network involved). */
export function downloadFile(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
