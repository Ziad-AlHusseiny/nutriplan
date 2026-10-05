import { expect, test } from '@playwright/test';
import { open, planWith, seed } from './helpers.js';

// Installable, and offline in a supermarket with no signal.
test.use({ serviceWorkers: 'allow' });

test('manifests describe an installable app in both languages', async ({ request }) => {
  for (const [path, lang, start] of [
    ['/manifest.webmanifest', 'en', '/planner'],
    ['/manifest-ar.webmanifest', 'ar', '/ar/planner'],
  ]) {
    const manifest = await (await request.get(path)).json();
    expect(manifest).toMatchObject({ short_name: 'NutriPlan', display: 'standalone', lang, start_url: start, scope: '/' });
    expect(manifest.icons.map((i) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
    expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true);
    for (const icon of manifest.icons) expect((await request.get(icon.src)).ok()).toBe(true);
  }
});

test('after one visit, the planner, the shopping list and a recipe work offline', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'once is enough');
  await seed(page, { plan: planWith({ monday: { lunch: { id: 'shakshuka', servings: 2 } } }) });
  await open(page, '/');
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    return reg.active?.state;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await context.setOffline(true);
  await open(page, '/shopping');
  await expect(page.locator('[data-item="eggs"]')).toContainText('4 eggs');
  await open(page, '/planner');
  await expect(page.getByTestId('planned-meal')).toContainText('Shakshuka');
  // Never visited: the app shell renders it.
  await open(page, '/recipes/shakshuka');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Shakshuka');
  await open(page, '/ar/shopping');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('قائمة المشتريات');
  await context.setOffline(false);
});
