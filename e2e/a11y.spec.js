import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { isMobile, open, planWith, seed } from './helpers.js';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function audit(page) {
  // Let entrance fades finish (they're opacity-only under reduced motion).
  await page.waitForTimeout(400);
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
}

const PLAN = planWith({
  monday: { breakfast: { id: 'overnight-berry-oats', servings: 1 }, lunch: { id: 'grilled-lemon-chicken-bowl', servings: 1.5 }, dinner: { id: 'custom:k', servings: 1 }, snacks: { id: 'greek-yogurt-parfait', servings: 0.5 } },
  tuesday: { dinner: { id: 'chicken-shawarma-plate', servings: 4 } },
});
const PAGES = ['/', '/recipes', '/recipes/grilled-lemon-chicken-bowl', '/planner', '/shopping', '/calculator', '/privacy'];

for (const theme of ['light', 'dark']) {
  for (const locale of ['en', 'ar']) {
    test(`axe: every page, ${locale}, ${theme}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme });
      await seed(page, { plan: PLAN, meals: [{ id: 'k', name: 'Koshari', kcal: 720 }], favorites: ['shakshuka'] });
      for (const path of PAGES) {
        await open(page, locale === 'ar' ? (path === '/' ? '/ar' : `/ar${path}`) : path);
        expect(await audit(page), path).toEqual([]);
      }
    });
  }
}

test('axe: the dialogs (picker, meal sheet, fill, cook mode, delete)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seed(page, { plan: PLAN, meals: [{ id: 'k', name: 'Koshari', kcal: 720 }] });
  await open(page, '/planner');
  await page.getByTestId('day-wednesday').getByTestId('add-meal').first().click();
  await expect(page.getByTestId('picker')).toBeVisible();
  expect(await audit(page)).toEqual([]);
  await page.keyboard.press('Escape');
  await page.getByTestId('slot-monday-lunch').getByTestId('edit-meal').click();
  await expect(page.getByTestId('meal-sheet')).toBeVisible();
  expect(await audit(page)).toEqual([]);
  await page.keyboard.press('Escape');
  await page.getByTestId('fill-open').click();
  expect(await audit(page)).toEqual([]);
  await page.getByTestId('fill-run').click();
  await expect(page.getByTestId('fill-result')).toBeVisible();
  expect(await audit(page)).toEqual([]);
  await page.keyboard.press('Escape');
  await open(page, '/recipes/shakshuka');
  await page.getByTestId('cook-open').click();
  await expect(page.getByTestId('cook-mode')).toBeVisible();
  await page.getByTestId('cook-ingredients-toggle').click();
  expect(await audit(page)).toEqual([]);
  await page.keyboard.press('Escape');
  await open(page, '/privacy');
  await page.getByTestId('delete-all').click();
  expect(await audit(page)).toEqual([]);
});

test('axe: the mobile menu and filters', async ({ page }, testInfo) => {
  test.skip(!isMobile(testInfo), 'phones only');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/recipes');
  await page.getByTestId('filters-toggle').click();
  expect(await audit(page)).toEqual([]);
  await page.getByTestId('menu-button').click();
  expect(await audit(page)).toEqual([]);
});

test('every control is reachable by Tab with a visible focus ring (BRIEF criterion 8)', async ({ page }, testInfo) => {
  test.skip(isMobile(testInfo), 'hardware keyboard');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seed(page, { plan: PLAN, meals: [{ id: 'k', name: 'Koshari', kcal: 720 }] });
  for (const [path, mustSee] of [
    ['/recipes', ['recipe-search', 'chip-cuisine-asian', 'max-kcal', 'favorite-shakshuka', 'developer-credit']],
    ['/planner', ['fill-open', 'add-meal', 'edit-meal', 'remove-meal', 'clear-day']],
  ]) {
    await open(page, path);
    const seen = new Set();
    for (let i = 0; i < 260; i += 1) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        const style = getComputedStyle(el);
        const ring = style.outlineStyle !== 'none' || getComputedStyle(el.closest('label') ?? el).outlineStyle !== 'none' || el.matches('.sr-only') || el.closest('article')?.matches(':has(a:focus-visible)');
        return { key: el.dataset.testid || el.getAttribute('aria-label') || el.textContent.trim().slice(0, 30), ring, tag: el.tagName };
      });
      if (info.tag === 'BODY') break;
      expect(info.ring, `focus ring on ${info.key}`).toBe(true);
      seen.add(info.key);
    }
    for (const key of mustSee) expect([...seen], `${path}: ${key}`).toContain(key);
  }
});
