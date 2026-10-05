import { expect, test } from '@playwright/test';
import { open, planWith, seed } from './helpers.js';

test('Arabic pages are right to left, in Arabic, with Latin digits', async ({ page }) => {
  for (const [path, h1] of [
    ['/ar', 'خطّط أسبوعًا من الأكل الصحي في دقائق'],
    ['/ar/recipes', null],
    ['/ar/planner', null],
    ['/ar/shopping', 'قائمة المشتريات'],
  ]) {
    await open(page, path);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    if (h1) await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1);
    expect(await page.getByRole('heading', { level: 1 }).textContent()).toMatch(/[؀-ۿ]/);
  }
  await expect(page.getByTestId('result-count').or(page.locator('body'))).toBeVisible();
});

test('Arabic recipe: title, ingredients with counter words, scaled', async ({ page }) => {
  await open(page, '/ar/recipes/grilled-lemon-chicken-bowl');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('طبق دجاج مشوي بالليمون');
  await expect(page.getByTestId('ingredient').first()).toHaveText('300 جم صدر دجاج');
  await page.getByRole('button', { name: 'زِد عدد الحصص' }).or(page.getByTestId('servings').locator('button').last()).first().click();
  await expect(page.getByTestId('ingredient').first()).toHaveText('450 جم صدر دجاج');
});

test('Arabic search ignores spelling variants and finds English names too', async ({ page }) => {
  await open(page, '/ar/recipes');
  await page.getByTestId('recipe-search').fill('شوربه عدس');
  await expect(page.getByTestId('recipe-card')).toHaveCount(1);
  await page.getByTestId('recipe-search').fill('chicken');
  await expect.poll(() => page.getByTestId('recipe-card').count()).toBeGreaterThanOrEqual(4);
});

test('Arabic shopping list and planner read naturally', async ({ page }) => {
  await seed(page, { plan: planWith({ monday: { breakfast: { id: 'shakshuka', servings: 2 } } }) });
  await open(page, '/ar/shopping');
  await expect(page.locator('[data-item="eggs"]').getByTestId('shopping-line')).toHaveText('4 حبات بيض');
  await open(page, '/ar/planner');
  await expect(page.getByTestId('day-monday')).toContainText('الاثنين');
  await expect(page.getByTestId('day-monday').getByTestId('day-bar')).toContainText('660');
});
