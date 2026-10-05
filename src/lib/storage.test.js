import { beforeEach, describe, expect, it, vi } from 'vitest';

function memoryStorage() {
  const map = new Map();
  return {
    get length() {
      return map.size;
    },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
}

// A "reload": fresh modules (every in-memory store forgotten), same localStorage.
async function freshStores() {
  vi.resetModules();
  const storage = await import('./storage.js');
  const stores = await import('./stores.js');
  return { ...storage, ...stores };
}

beforeEach(() => {
  globalThis.localStorage = memoryStorage();
});

describe('persistence (BRIEF criterion 6)', () => {
  it('a planned week and a saved target survive a reload', async () => {
    let s = await freshStores();
    s.planStore.set({ version: 2, weeks: { '2026-10-05': { monday: { breakfast: { id: 'shakshuka', servings: 1 } } } } });
    s.targetStore.set(1550);
    s.favoritesStore.set(['shakshuka']);
    // "Reload": forget every in-memory store, read again from storage.
    s = await freshStores();
    expect(s.planStore.get().weeks['2026-10-05'].monday.breakfast).toEqual({ id: 'shakshuka', servings: 1 });
    expect(s.targetStore.get()).toBe(1550);
    expect(s.favoritesStore.get()).toEqual(['shakshuka']);
  });

  it('defaults: an empty plan and a 2,000 kcal target', async () => {
    const s = await freshStores();
    expect(s.planStore.get()).toEqual({ version: 2, weeks: {} });
    expect(s.targetStore.get()).toBe(2000);
    expect(s.macrosStore.get()).toBeNull();
  });

  it('invalid JSON in nutriplan-plan resets to an empty plan and rewrites the key (PRD §6.5)', async () => {
    localStorage.setItem('nutriplan-plan', '{not json');
    const s = await freshStores();
    expect(s.planStore.get()).toEqual({ version: 2, weeks: {} });
    expect(JSON.parse(localStorage.getItem('nutriplan-plan'))).toEqual({ version: 2, weeks: {} });
  });

  it('hand-edited values are cleaned, never trusted', async () => {
    localStorage.setItem('nutriplan-target', JSON.stringify('lots'));
    localStorage.setItem('nutriplan-favorites', JSON.stringify(['shakshuka', 'nope', 3]));
    localStorage.setItem('nutriplan-meals', JSON.stringify([{ id: 'a', name: 'Koshari', kcal: 700 }, { id: 'b', name: '', kcal: 5 }, { id: 'c', name: 'x', kcal: -1 }]));
    localStorage.setItem('nutriplan-shopping', JSON.stringify({ weeks: { '2026-10-05': { checked: ['lemon', 5], extras: [{ id: 'e', text: 'coffee' }, { id: 'f', text: '' }] }, junk: {} } }));
    const s = await freshStores();
    expect(s.targetStore.get()).toBe(2000);
    expect(s.favoritesStore.get()).toEqual(['shakshuka']);
    expect(s.mealsStore.get().map((m) => m.id)).toEqual(['a']);
    expect(s.shoppingStore.get()).toEqual({ weeks: { '2026-10-05': { checked: ['lemon'], extras: [{ id: 'e', text: 'coffee', checked: false }] } } });
  });

  it('keeps working in memory when storage is blocked', async () => {
    globalThis.localStorage = {
      setItem() {
        throw new Error('blocked');
      },
      getItem: () => null,
      removeItem() {},
    };
    const { storageAvailable, createStore } = await freshStores();
    expect(storageAvailable()).toBe(false);
    const store = createStore('plan-test', 1);
    store.set(5);
    expect(store.get()).toBe(5);
  });

  it('clearAll removes every nutriplan key and nothing else', async () => {
    localStorage.setItem('other-app', 'keep');
    const s = await freshStores();
    s.targetStore.set(1800);
    s.favoritesStore.set(['shakshuka']);
    expect(s.savedKeys()).toEqual(['favorites', 'target']);
    s.clearAll();
    expect(s.savedKeys()).toEqual([]);
    expect(s.readRaw('target')).toBeNull();
    expect(localStorage.getItem('other-app')).toBe('keep');
    expect(s.targetStore.get()).toBe(2000);
  });
});

describe('targets the calculator can produce always persist (review finding 7)', () => {
  it('accepts 590 and 7,780 kcal, and macros up to the shared caps', async () => {
    let s = await freshStores();
    s.targetStore.set(7780);
    s.macrosStore.set({ protein: 450, carbs: 900, fat: 260 });
    s = await freshStores();
    expect(s.targetStore.get()).toBe(7780);
    expect(s.macrosStore.get()).toEqual({ protein: 450, carbs: 900, fat: 260 });
    s.targetStore.set(590);
    s = await freshStores();
    expect(s.targetStore.get()).toBe(590);
  });
});
