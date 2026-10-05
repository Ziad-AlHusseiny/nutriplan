import { expect, test } from '@playwright/test';
import { isMobile, open, seed, stored } from './helpers.js';

const cards = (page) => page.getByTestId('recipe-card');
const kcalOf = async (page) => (await page.getByTestId('recipe-card').allTextContents()).map((txt) => Number(/(\d+) kcal/.exec(txt)[1]));

async function moreFilters(page, testInfo) {
  if (isMobile(testInfo)) await page.getByTestId('filters-toggle').click();
}

test('all 30 recipes by default (PRD §4)', async ({ page }) => {
  await open(page, '/recipes');
  await expect(cards(page)).toHaveCount(30);
  await expect(page.getByTestId('result-count')).toHaveText('30 recipes');
});

test('chips: OR within a group, AND across groups, aria-pressed', async ({ page }) => {
  await open(page, '/recipes');
  const vegan = page.getByTestId('chip-diet-vegan');
  await vegan.click();
  await expect(vegan).toHaveAttribute('aria-pressed', 'true');
  await expect(cards(page)).toHaveCount(10);
  const veganCount = 10;
  for (const txt of await cards(page).allTextContents()) expect(txt).toContain('Vegan');
  await page.getByTestId('chip-diet-keto').click();
  await expect.poll(() => cards(page).count()).toBeGreaterThan(veganCount);
  await page.getByTestId('chip-diet-keto').click();
  await page.getByTestId('chip-cuisine-asian').click();
  await expect(cards(page)).toHaveCount(2);
  for (const txt of await cards(page).allTextContents()) {
    expect(txt).toContain('Asian');
    expect(txt).toContain('Vegan');
  }
});

test('a chip toggles with Space and Enter', async ({ page }, testInfo) => {
  test.skip(isMobile(testInfo), 'hardware keyboard');
  await open(page, '/recipes');
  const chip = page.getByTestId('chip-cuisine-italian');
  await chip.focus();
  await page.keyboard.press('Space');
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Enter');
  await expect(chip).toHaveAttribute('aria-pressed', 'false');
});

test('max calories 500: no card above 500 kcal', async ({ page }, testInfo) => {
  await open(page, '/recipes');
  await moreFilters(page, testInfo);
  await page.getByTestId('max-kcal').fill('500');
  await expect(page.getByTestId('max-kcal-value')).toHaveText('500 kcal');
  await expect.poll(() => cards(page).count()).toBeLessThan(30);
  for (const kcal of await kcalOf(page)) expect(kcal).toBeLessThanOrEqual(500);
  await page.getByTestId('max-kcal').fill('800');
  await expect(page.getByTestId('max-kcal-value')).toHaveText('Any');
});

test('search matches titles and ingredients', async ({ page }) => {
  await open(page, '/recipes');
  await page.getByTestId('recipe-search').fill('chicken');
  await expect.poll(() => cards(page).count()).toBeLessThan(30);
  const n = await cards(page).count();
  expect(n).toBeGreaterThanOrEqual(4);
  for (const txt of await cards(page).allTextContents()) expect(txt.toLowerCase()).toContain("chicken");
  await page.getByTestId('recipe-search').fill('tahini');
  await expect.poll(async () => (await cards(page).allTextContents()).join()).toContain('Falafel');
});

test('empty state, then "Clear all filters" restores all 30', async ({ page }) => {
  await open(page, '/recipes');
  await page.getByTestId('recipe-search').fill('chocolate cake');
  await expect(page.getByRole('heading', { name: 'No recipes match' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear all filters' }).click();
  await expect(cards(page)).toHaveCount(30);
  await expect(page.getByTestId('recipe-search')).toHaveValue('');
});

test('"Clear filters" resets every control in one go', async ({ page }, testInfo) => {
  await open(page, '/recipes');
  await page.getByTestId('chip-cuisine-mexican').click();
  await page.getByTestId('chip-diet-high-protein').click();
  await moreFilters(page, testInfo);
  await page.getByTestId('max-time').fill('30');
  await page.getByTestId('clear-filters').click();
  await expect(cards(page)).toHaveCount(30);
  await expect(page.getByTestId('chip-cuisine-mexican')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('max-time-value')).toHaveText('Any');
  await expect(page.getByTestId('clear-filters')).toHaveCount(0);
});

test('mobile: the Filters disclosure shows the active count', async ({ page }, testInfo) => {
  test.skip(!isMobile(testInfo), 'phones only');
  await open(page, '/recipes');
  await expect(page.locator('#more-filters')).toBeHidden();
  await page.getByTestId('chip-diet-keto').click();
  await expect(page.getByTestId('filters-toggle')).toContainText('Filters · 1');
  await page.getByTestId('filters-toggle').click();
  await expect(page.getByTestId('max-kcal')).toBeVisible();
});

test('favorites: the heart saves a recipe; the Favorites filter shows only those', async ({ page }, testInfo) => {
  await open(page, '/recipes');
  await page.getByTestId('favorite-shakshuka').click();
  await expect(page.getByTestId('favorite-shakshuka')).toHaveAttribute('aria-pressed', 'true');
  expect(await stored(page, 'favorites')).toEqual(['shakshuka']);
  await moreFilters(page, testInfo);
  await page.getByTestId('chip-favorites').click();
  await expect(cards(page)).toHaveCount(1);
});

test('a card opens its recipe (click or Enter)', async ({ page }, testInfo) => {
  await open(page, '/');
  await page.getByTestId('recipe-card').first().getByRole('link').click();
  await expect(page).toHaveURL(/\/recipes\/grilled-lemon-chicken-bowl$/);
  if (isMobile(testInfo)) return;
  await open(page, '/');
  await page.getByTestId('recipe-card').nth(1).getByRole('link').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/recipes\/rainbow-tofu-stir-fry$/);
});

test('filters survive opening a recipe and coming back', async ({ page }) => {
  await seed(page, {});
  await open(page, '/recipes');
  await page.getByTestId('chip-cuisine-italian').click();
  await expect(cards(page)).toHaveCount(5);
  await cards(page).first().getByRole('link').click();
  await page.getByTestId('back-link').click();
  await expect(cards(page)).toHaveCount(5);
});
