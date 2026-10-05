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
  };
}

async function fresh() {
  vi.resetModules();
  return { ...(await import('./stores.js')), ...(await import('./backup.js')), ...(await import('./storage.js')) };
}

beforeEach(() => {
  globalThis.localStorage = memoryStorage();
});

const W = '2026-10-05';

describe('backup and restore', () => {
  it('round-trips everything that was saved', async () => {
    let s = await fresh();
    s.planStore.set({ version: 2, weeks: { [W]: { monday: { breakfast: { id: 'shakshuka', servings: 1 } } } } });
    s.targetStore.set(1800);
    s.mealsStore.set([{ id: 'k1', name: 'Koshari', kcal: 700 }]);
    const backup = JSON.parse(JSON.stringify(s.buildBackup(new Date('2026-10-05T10:00:00Z'))));
    expect(backup.app).toBe('nutriplan');
    expect(Object.keys(backup.data).sort()).toEqual(['meals', 'plan', 'target']);

    globalThis.localStorage = memoryStorage();
    s = await fresh();
    s.restoreBackup(backup);
    expect(s.planStore.get().weeks[W].monday.breakfast.id).toBe('shakshuka');
    expect(s.targetStore.get()).toBe(1800);
    expect(s.mealsStore.get()[0].name).toBe('Koshari');
  });

  it('merges plans slot by slot: what is already planned wins', async () => {
    const s = await fresh();
    s.planStore.set({ version: 2, weeks: { [W]: { monday: { breakfast: { id: 'ful-medames', servings: 1 } } } } });
    s.restoreBackup({ app: 'nutriplan', data: { plan: { version: 2, weeks: { [W]: { monday: { breakfast: { id: 'shakshuka' }, lunch: { id: 'falafel-bowl' } } } } } } });
    expect(s.planStore.get().weeks[W].monday.breakfast.id).toBe('ful-medames');
    expect(s.planStore.get().weeks[W].monday.lunch.id).toBe('falafel-bowl');
  });

  it('rejects files that are not NutriPlan backups, and cleans hostile values', async () => {
    const s = await fresh();
    expect(() => s.restoreBackup({ app: 'serenity', data: {} })).toThrow('not-a-backup');
    expect(() => s.restoreBackup(null)).toThrow();
    s.restoreBackup({ app: 'nutriplan', data: { target: 'lots', favorites: ['shakshuka', '__proto__'], theme: 'neon' } });
    expect(s.targetStore.get()).toBe(2000);
    expect(s.favoritesStore.get()).toEqual(['shakshuka']);
    expect(s.themeStore.get()).toBeNull();
  });
});
