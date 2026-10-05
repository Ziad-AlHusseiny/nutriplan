import { expect } from '@playwright/test';

export const isMobile = (testInfo) => testInfo.project.name === 'mobile';

/** Opens a page and waits until React has hydrated it. */
export async function open(page, path = '/') {
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  await page.waitForFunction(() => {
    const main = document.getElementById('main');
    return Boolean(main) && Object.keys(document.getElementById('root')).some((k) => k.startsWith('__reactContainer')) && !main.querySelector('[aria-busy="true"]') && document.documentElement.dataset.hydrated === '1';
  });
}

export const stored = (page, key) => page.evaluate((k) => JSON.parse(localStorage.getItem(`nutriplan-${k}`)), key);

/** Seeds saved values before the page's own scripts run (first load only). */
export function seed(page, values) {
  return page.addInitScript((entries) => {
    if (sessionStorage.getItem('seeded')) return;
    for (const [k, v] of Object.entries(entries)) localStorage.setItem(`nutriplan-${k}`, typeof v === 'string' ? v : JSON.stringify(v));
    sessionStorage.setItem('seeded', '1');
  }, values);
}

/** The Monday of this week, as the planner keys it ("2026-10-05"). */
export function thisWeekKey(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const emptyDay = () => ({ breakfast: null, lunch: null, dinner: null, snacks: null });
export function week(days = {}) {
  const out = {};
  for (const d of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) out[d] = { ...emptyDay(), ...(days[d] ?? {}) };
  return out;
}
export const planWith = (days, key = thisWeekKey()) => ({ version: 2, weeks: { [key]: week(days) } });
