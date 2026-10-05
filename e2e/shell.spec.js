import { expect, test } from '@playwright/test';
import { isMobile, open } from './helpers.js';

test('every route renders inside the shared shell, with its own title', async ({ page }) => {
  for (const [path, h1, title] of [
    ['/', 'Plan a week of healthy eating in minutes', /^NutriPlan: plan a week/],
    ['/recipes', 'Find your next meal', /^Recipes · NutriPlan/],
    ['/recipes/shakshuka', 'Shakshuka', /^Shakshuka · NutriPlan/],
    ['/planner', 'Your week', /^Weekly planner/],
    ['/shopping', 'Shopping list', /^Shopping list/],
    ['/calculator', 'Know your numbers', /^Calorie calculator/],
    ['/privacy', 'Your data stays here', /^Your data/],
  ]) {
    await open(page, path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1);
    await expect(page).toHaveTitle(title);
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(page.getByTestId('developer-credit')).toHaveAttribute('href', 'https://github.com/Ziad-AlHusseiny');
  }
});

test('the static HTML is the full page before any script runs', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/recipes/grilled-lemon-chicken-bowl');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Grilled Lemon Chicken Bowl');
  await expect(page.getByTestId('ingredient').first()).toHaveText('300 g chicken breast');
  await page.goto('/recipes');
  await expect(page.getByTestId('recipe-card')).toHaveCount(30);
  await context.close();
});

test('unknown paths redirect home (PRD §1)', async ({ page }) => {
  const res = await page.goto('/this/does/not/exist');
  expect(res.status()).toBe(404);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Plan a week of healthy eating in minutes');
});

test('nav links navigate on the client and mark the active page', async ({ page }, testInfo) => {
  await open(page, '/');
  if (isMobile(testInfo)) {
    await page.getByTestId('tab-recipes').click();
  } else {
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Recipes' }).click();
  }
  await expect(page).toHaveURL(/\/recipes$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find your next meal');
  if (!isMobile(testInfo)) await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Recipes' })).toHaveAttribute('aria-current', 'page');
});

test('mobile menu: opens, closes on Esc and returns focus (PRD §2.1)', async ({ page }, testInfo) => {
  test.skip(!isMobile(testInfo), 'phones only');
  await open(page, '/');
  const button = page.getByTestId('menu-button');
  await button.click();
  await expect(page.locator('#mobile-menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#mobile-menu')).toHaveCount(0);
  await expect(button).toBeFocused();
  await button.click();
  await page.locator('#mobile-menu').getByRole('link', { name: 'Calculator' }).click();
  await expect(page).toHaveURL(/\/calculator$/);
  await expect(page.locator('#mobile-menu')).toHaveCount(0);
});

test('the language toggle keeps the current page, and is remembered', async ({ page }, testInfo) => {
  await open(page, '/recipes/shakshuka');
  if (isMobile(testInfo)) await page.getByTestId('menu-button').click();
  await page.getByTestId('language-toggle').locator('visible=true').first().click();
  await expect(page).toHaveURL(/\/ar\/recipes\/shakshuka$/);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('شكشوكة');
  // A saved Arabic choice sends English addresses to their Arabic twin…
  await page.goto('/planner');
  await expect(page).toHaveURL(/\/ar\/planner$/);
  // …until English is chosen again.
  await page.goto('/planner?lang=en');
  await expect(page).toHaveURL(/\/planner$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('the evening theme toggles, is remembered, and never flashes', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await open(page, '/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByTestId('theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('no horizontal scroll on any page (BRIEF criterion 7)', async ({ page }) => {
  for (const path of ['/', '/recipes', '/recipes/falafel-bowl', '/planner', '/shopping', '/calculator', '/privacy', '/ar', '/ar/planner']) {
    await open(page, path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
