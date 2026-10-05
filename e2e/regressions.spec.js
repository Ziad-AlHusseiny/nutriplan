import { expect, test } from '@playwright/test';
import { open, planWith, seed } from './helpers.js';

// Bugs found while building, kept fixed.

test('saved meals show after a reload even when Motion’s chunk is slow (AnimatePresence exit hang)', async ({ page }) => {
  await page.route(/motionFeatures-.*\.js$/, async (route) => {
    await new Promise((r) => setTimeout(r, 2500));
    await route.continue();
  });
  await seed(page, { plan: planWith({ monday: { breakfast: { id: 'shakshuka', servings: 1 }, dinner: { id: 'turkey-chili', servings: 1 } } }) });
  await open(page, '/planner');
  await expect(page.getByTestId('planned-meal')).toHaveCount(2, { timeout: 1500 });
  // …and they still work once it arrives.
  await page.waitForTimeout(3000);
  await page.getByRole('button', { name: 'Remove Shakshuka from Monday breakfast' }).click();
  await expect(page.getByTestId('planned-meal')).toHaveCount(1);
});

test('filtering before Motion loads still updates the grid', async ({ page }) => {
  await page.route(/motionFeatures-.*\.js$/, async (route) => {
    await new Promise((r) => setTimeout(r, 3000));
    await route.continue();
  });
  await open(page, '/recipes');
  await page.getByTestId('chip-cuisine-italian').click();
  await expect(page.getByTestId('recipe-card')).toHaveCount(5, { timeout: 1500 });
});

test('prerendered pages are complete in place (no outlined Suspense reveal script)', async ({ request }) => {
  for (const path of ['/', '/planner', '/recipes', '/ar/recipes']) {
    const html = await (await request.get(path)).text();
    expect(html, path).not.toContain('$RC(');
    expect(html, path).not.toContain('<template id="B:');
  }
});

test('the header CTA and language toggle stay hidden on phones (no sideways scroll)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 760 });
  await open(page, '/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await expect(page.getByRole('banner').getByRole('link', { name: 'Start planning' })).toBeHidden();
});

test('planner: no layout shift from the empty-week banner, for new and returning visitors', async ({ page }) => {
  // New visitor: the banner is in the static HTML.
  const html = await (await page.request.get('/planner')).text();
  expect(html).toContain('Plan your first meal');
  // Returning visitor: hidden before paint, gone after hydration, back for an empty week.
  await seed(page, { plan: planWith({ monday: { lunch: { id: 'shakshuka', servings: 1 } } }) });
  await page.goto('/planner');
  expect(await page.evaluate(() => {
    const el = document.querySelector('[data-empty-week]');
    return el ? getComputedStyle(el).display : 'gone';
  })).not.toBe('block');
  await open(page, '/planner');
  await expect(page.getByRole('heading', { name: 'Plan your first meal' })).toHaveCount(0);
  await page.getByTestId('week-next').click();
  await expect(page.getByRole('heading', { name: 'Plan your first meal' })).toBeVisible();
});

// ── From the pre-merge code review ─────────────────────────────────────
const day = (page, d) => page.getByTestId(`day-${d}`);

test('review 2: after deleting a meal, "New meal" opens an empty form', async ({ page }) => {
  page.on('dialog', (d) => d.accept());
  await seed(page, { plan: planWith({ monday: { dinner: { id: 'custom:k', servings: 1 } } }), meals: [{ id: 'k', name: 'Koshari', kcal: 700 }] });
  await open(page, '/planner');
  await page.getByTestId('slot-monday-dinner').getByTestId('edit-meal').click();
  await page.getByTestId('meal-sheet').getByRole('button', { name: 'Edit' }).click();
  await page.getByTestId('meal-kcal').fill('999');
  await page.getByTestId('custom-meal').getByRole('button', { name: 'Delete meal' }).click();
  await expect(page.getByTestId('planned-meal')).toHaveCount(0);
  await day(page, 'tuesday').getByTestId('add-meal').first().click();
  await page.getByTestId('picker-tab-mine').click();
  await page.getByTestId('picker-new-meal').click();
  await expect(page.getByTestId('meal-name')).toHaveValue('');
  await expect(page.getByTestId('meal-kcal')).toHaveValue('');
  // The page stays locked behind the second dialog (review 5).
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('hidden');
});

test('review 3: Undo disappears once the week changes again', async ({ page }) => {
  await seed(page, { plan: planWith({ monday: { lunch: { id: 'shakshuka', servings: 1 }, dinner: { id: 'turkey-chili', servings: 1 } } }) });
  await open(page, '/planner');
  await page.getByRole('button', { name: 'Remove Shakshuka from Monday lunch' }).click();
  await expect(page.getByTestId('toast').getByRole('button', { name: 'Undo' })).toBeVisible();
  await page.getByTestId('slot-monday-dinner').getByTestId('edit-meal').click();
  await page.getByTestId('meal-sheet').getByRole('button', { name: 'Increase servings' }).click();
  await expect(page.getByTestId('toast')).toHaveCount(0);
});

test('review 6: the picker starts with an empty search every time', async ({ page }) => {
  await open(page, '/planner');
  await day(page, 'monday').getByTestId('add-meal').first().click();
  await page.getByTestId('picker-search').fill('oats');
  await page.getByTestId('picker-row').first().click();
  await day(page, 'tuesday').getByTestId('add-meal').first().click();
  await expect(page.getByTestId('picker-search')).toHaveValue('');
  await expect(page.getByTestId('picker-row')).toHaveCount(30);
});

test('review 5: focus lands on "+ Add meal" after removing, on the day after clearing', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'hardware keyboard');
  await seed(page, { plan: planWith({ monday: { lunch: { id: 'shakshuka', servings: 1 }, dinner: { id: 'turkey-chili', servings: 1 } } }) });
  await open(page, '/planner');
  await page.getByRole('button', { name: 'Remove Shakshuka from Monday lunch' }).click();
  await expect(page.getByTestId('slot-monday-lunch').getByTestId('add-meal')).toBeFocused();
  await day(page, 'monday').getByTestId('clear-day').click();
  await expect(page.locator('#day-title-monday')).toBeFocused();
});

test('review 12: "Open planner" after adding to next week shows next week; Repeat last week can be undone', async ({ page }) => {
  await open(page, '/recipes/shakshuka');
  await page.getByTestId('add-to-plan-open').click();
  await page.getByTestId('add-to-plan').getByText('Next week').click();
  await page.getByTestId('add-to-plan-confirm').click();
  await page.getByTestId('toast').getByRole('button', { name: 'Open planner →' }).click();
  await expect(page.getByTestId('week-name')).toHaveText('Next week');
  await expect(page.getByTestId('planned-meal')).toHaveCount(1);

  await page.getByTestId('week-next').click();
  await page.getByTestId('repeat-week').click();
  await expect(page.getByTestId('planned-meal')).toHaveCount(1);
  await page.getByTestId('toast').getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByTestId('planned-meal')).toHaveCount(0);
});

test('review 7: a big calculated target survives a reload', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/calculator');
  await page.getByTestId('sex-male').check({ force: true });
  await page.getByTestId('age').fill('20');
  await page.getByTestId('heightCm').fill('200');
  await page.getByTestId('weightKg').fill('200');
  await page.getByTestId('activity').selectOption('athlete');
  await page.getByTestId('calculate').click();
  await page.getByTestId('goal-gain').click();
  await page.getByTestId('save-target').click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('nutriplan-target')));
  expect(saved).toBeGreaterThan(6000);
  await open(page, '/planner');
  await page.reload();
  await expect(page.getByTestId('target-row')).toContainText(new Intl.NumberFormat('en-US').format(saved));
});
