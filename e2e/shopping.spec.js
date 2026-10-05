import { expect, test } from '@playwright/test';
import { open, planWith, seed, stored, thisWeekKey } from './helpers.js';

const row = (page, item) => page.locator(`[data-testid="shopping-row"][data-item="${item}"]`);

const PLAN = planWith({
  monday: { lunch: { id: 'grilled-lemon-chicken-bowl', servings: 2 }, dinner: { id: 'chicken-fajitas', servings: 2 } },
  tuesday: { breakfast: { id: 'shakshuka', servings: 1 }, dinner: { id: 'custom:k', servings: 1 } },
  wednesday: { lunch: { id: 'cobb-salad', servings: 2 } },
});

test('nothing planned: an empty state that leads to the planner', async ({ page }) => {
  await open(page, '/shopping');
  await expect(page.getByRole('heading', { name: 'Nothing to buy yet' })).toBeVisible();
  await page.getByRole('link', { name: 'Open the planner' }).click();
  await expect(page).toHaveURL(/\/planner$/);
});

test('ingredients merge across recipes and servings, by aisle', async ({ page }) => {
  await seed(page, { plan: PLAN, meals: [{ id: 'k', name: 'Koshari', kcal: 700 }] });
  await open(page, '/shopping');
  // 300 + 300 + 250 g of chicken breast, one line.
  await expect(row(page, 'chicken-breast').getByTestId('shopping-line')).toHaveText('850 g chicken breast');
  await expect(row(page, 'chicken-breast')).toContainText('For Grilled Lemon Chicken Bowl, Sheet-Pan Chicken Fajitas, and Chicken Cobb Salad');
  // Shakshuka for 1 of 2: 2 eggs; Cobb salad 2 eggs → 4 eggs.
  await expect(row(page, 'eggs').getByTestId('shopping-line')).toHaveText('4 eggs');
  await expect(page.getByTestId('aisle-produce')).toBeVisible();
  await expect(page.getByTestId('aisle-meat')).toContainText('850 g chicken breast');
  // Staples start under "Already have"; your own meals are named, not guessed.
  await expect(page.getByTestId('already-have')).toContainText('Already have (3)');
  await expect(page.getByText('Not on the list: Koshari')).toBeVisible();
});

test('tick items off in the store; it survives a reload', async ({ page }) => {
  await seed(page, { plan: PLAN });
  await open(page, '/shopping');
  const before = await page.getByTestId('to-buy').textContent();
  await row(page, 'lemon').getByTestId('shopping-label').click();
  await expect(row(page, 'lemon')).toHaveAttribute('data-checked', 'true');
  await expect(page.getByTestId('to-buy')).not.toHaveText(before);
  await page.reload();
  await expect(row(page, 'lemon')).toHaveAttribute('data-checked', 'true');
  expect((await stored(page, 'shopping')).weeks[thisWeekKey()].checked).toEqual(['lemon']);
});

test('"Have it" moves an item to Already have, and back', async ({ page }) => {
  await seed(page, { plan: PLAN });
  await open(page, '/shopping');
  await row(page, 'cumin').getByTestId('have-it').click();
  await expect(row(page, 'cumin')).toHaveCount(0);
  await page.getByTestId('already-have').locator('summary').click();
  await page.getByRole('button', { name: 'I need ground cumin after all' }).click();
  await expect(row(page, 'cumin')).toHaveCount(1);
});

test('your own extras, days filter, and sharing as plain text', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'clipboard permissions');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await seed(page, { plan: PLAN });
  await open(page, '/shopping');
  await page.getByTestId('extra-input').fill('Coffee beans');
  await page.getByTestId('extra-add').click();
  await expect(page.getByTestId('extra-row')).toHaveText(/Coffee beans/);
  await page.evaluate(() => {
    // Force the clipboard path (desktop browsers have no share sheet).
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  });
  await page.getByTestId('share-list').click();
  await expect(page.getByTestId('toast')).toContainText('List copied');
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain('NutriPlan shopping list');
  expect(text).toContain('- 850 g chicken breast');
  expect(text).toContain('- Coffee beans');
  // Only Wednesday: just the Cobb salad.
  await page.getByTestId('day-chip-wednesday').click();
  await expect(row(page, 'chicken-breast').getByTestId('shopping-line')).toHaveText('250 g chicken breast');
  await expect(row(page, 'flour-tortillas')).toHaveCount(0);
});
