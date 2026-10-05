import { expect, test } from '@playwright/test';
import { isMobile, open, stored } from './helpers.js';

const ingredient = (page, i) => page.getByTestId('ingredient').nth(i);

test('servings rescale amounts: 300 g for 2 → 450 g for 3 (PRD §5.3)', async ({ page }) => {
  await open(page, '/recipes/grilled-lemon-chicken-bowl');
  await expect(ingredient(page, 0)).toHaveText('300 g chicken breast');
  await page.getByRole('button', { name: 'Increase servings' }).click();
  await expect(page.getByTestId('servings-value')).toHaveText('3');
  await expect(ingredient(page, 0)).toHaveText('450 g chicken breast');
  await expect(ingredient(page, 2)).toHaveText('1.5 cucumbers');
  // "to taste" never changes.
  await expect(page.getByTestId('ingredient').last()).toHaveText('black pepper, to taste');
});

test('the stepper stops at 1 and 8, visibly disabled', async ({ page }) => {
  await open(page, '/recipes/overnight-berry-oats');
  const minus = page.getByRole('button', { name: 'Decrease servings' });
  const plus = page.getByRole('button', { name: 'Increase servings' });
  await expect(minus).toBeDisabled();
  for (let i = 0; i < 7; i += 1) await plus.click();
  await expect(page.getByTestId('servings-value')).toHaveText('8');
  await expect(plus).toBeDisabled();
});

test('US units convert weights and volumes', async ({ page }) => {
  await open(page, '/recipes/grilled-lemon-chicken-bowl');
  await page.getByTestId('units-us').check({ force: true });
  await expect(ingredient(page, 0)).toHaveText('11 oz chicken breast');
  expect(await stored(page, 'units')).toBe('us');
});

test('rings and donut match the macro maths: 32% / 29% / 36% (PRD §5.5)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/recipes/grilled-lemon-chicken-bowl');
  await expect(page.getByTestId('ring-protein')).toHaveAttribute('data-percent', '32');
  await expect(page.getByTestId('ring-carbs')).toHaveAttribute('data-percent', '29');
  await expect(page.getByTestId('ring-fat')).toHaveAttribute('data-percent', '36');
  await expect(page.getByRole('img', { name: 'Protein: 42 grams, 32% of calories' })).toBeVisible();
  await expect(page.getByTestId('donut-kcal')).toHaveText('520');
  const shares = await page.getByTestId('macro-donut').locator('circle[data-share]').evaluateAll((els) => els.map((e) => Number(e.dataset.share)));
  expect(shares.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 3);
});

test('reduced motion: rings and kcal render at final values, no animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/recipes/turkey-chili');
  await page.getByTestId('nutrition-panel').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('nutrition-panel')).toHaveAttribute('data-phase', 'final');
  await expect(page.getByTestId('donut-kcal')).toHaveText('450');
});

test('steps checklist: progress caption updates (PRD §5.4)', async ({ page }) => {
  await open(page, '/recipes/grilled-lemon-chicken-bowl');
  await expect(page.getByTestId('steps-progress')).toHaveText('0 of 6 steps done');
  const labels = page.getByTestId('step-label');
  for (let i = 0; i < 4; i += 1) await labels.nth(i).click();
  await expect(page.getByTestId('steps-progress')).toHaveText('4 of 6 steps done');
  await expect(page.getByTestId('step-checkbox').nth(3)).toBeChecked();
  await labels.nth(0).click();
  await expect(page.getByTestId('steps-progress')).toHaveText('3 of 6 steps done');
});

test('unknown recipe id: not-found state with a way back (PRD §5.6)', async ({ page }) => {
  const res = await page.goto('/recipes/does-not-exist');
  expect(res.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Recipe not found');
  await page.getByRole('link', { name: 'Browse all recipes' }).click();
  await expect(page).toHaveURL(/\/recipes$/);
});

test('add to planner from a recipe', async ({ page }) => {
  await open(page, '/recipes/shakshuka');
  await page.getByTestId('add-to-plan-open').click();
  const dialog = page.getByTestId('add-to-plan');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Friday', exact: true }).click();
  await dialog.getByRole('button', { name: 'Breakfast', exact: true }).click();
  await page.getByTestId('add-to-plan-confirm').click();
  await expect(page.getByTestId('toast')).toContainText('Added to Friday · Breakfast.');
  const plan = await stored(page, 'plan');
  const week = Object.values(plan.weeks)[0];
  expect(week.friday.breakfast).toEqual({ id: 'shakshuka', servings: 1 });
});

test('cook mode: big steps, keyboard, timers, ingredients, exit', async ({ page }, testInfo) => {
  test.skip(isMobile(testInfo), 'hardware keyboard');
  await open(page, '/recipes/grilled-lemon-chicken-bowl');
  await page.getByTestId('cook-open').click();
  const cook = page.getByTestId('cook-mode');
  await expect(cook).toBeVisible();
  await expect(page.getByTestId('cook-step')).toContainText('Rinse the quinoa');
  await expect(page.getByTestId('cook-progress')).toHaveText('Step 1 of 6');
  // Step 1 has a 15-minute timer: T starts it, the list shows it running.
  await page.keyboard.press('t');
  await expect(cook.getByTestId('timer')).toContainText('Step 1');
  await expect(cook.getByRole('timer')).toHaveText(/1[45]:\d\d/);
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('cook-progress')).toHaveText('Step 2 of 6');
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByTestId('cook-progress')).toHaveText('Step 1 of 6');
  await page.keyboard.press('i');
  await expect(page.getByTestId('cook-ingredients')).toContainText('300 g chicken breast');
  await page.keyboard.press('End');
  await expect(page.getByTestId('cook-progress')).toHaveText('Step 6 of 6');
  await page.getByTestId('cook-next').click();
  await expect(cook.getByText('Enjoy your meal').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(cook).toBeHidden();
  // The timer keeps running on the recipe page.
  await expect(page.getByTestId('timer-list')).toBeVisible();
  await page.getByTestId('timer-dismiss').click();
  await expect(page.getByTestId('timer-list')).toHaveCount(0);
});

test('a finished timer chimes and stays until dismissed', async ({ page }) => {
  await page.clock.install();
  await open(page, '/recipes/avocado-egg-toast');
  await page.getByTestId('step-timer').first().click();
  await expect(page.getByTestId('timer')).toContainText('Step 1');
  await page.clock.runFor(181_000);
  await expect(page.getByTestId('timer')).toHaveAttribute('data-done', 'true');
  await expect(page.getByTestId('timer')).toContainText('Time’s up: step 1');
});
