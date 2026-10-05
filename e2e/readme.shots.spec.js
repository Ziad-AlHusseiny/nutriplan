import { expect, test } from '@playwright/test';
import { open, planWith, seed } from './helpers.js';

// README screenshots, off by default:
//   SHOTS=1 npx playwright test readme.shots --project=desktop
// Writes JPEGs to docs/screenshots/ (and the root gallery preview and the
// social image to ../docs/previews/nutriplan.jpg and public/og.jpg).
test.skip(!process.env.SHOTS, 'set SHOTS=1 to regenerate README screenshots');
test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

const shot = (page, name, opts = {}) => page.screenshot({ path: `docs/screenshots/${name}.jpg`, type: 'jpeg', quality: 82, ...opts });

/** A believable week: real breakfasts, lunches, dinners and snacks, mostly on target. */
const WEEK = planWith({
  monday: { breakfast: { id: 'overnight-berry-oats', servings: 1 }, lunch: { id: 'grilled-lemon-chicken-bowl', servings: 1 }, dinner: { id: 'red-lentil-soup', servings: 1.5 }, snacks: { id: 'greek-yogurt-parfait', servings: 1 } },
  tuesday: { breakfast: { id: 'shakshuka', servings: 1 }, lunch: { id: 'black-bean-burrito-bowl', servings: 1 }, dinner: { id: 'lemon-herb-salmon', servings: 1 }, snacks: { id: 'guacamole-veggie-sticks', servings: 0.5 } },
  wednesday: { breakfast: { id: 'avocado-egg-toast', servings: 1 }, lunch: { id: 'falafel-bowl', servings: 1 }, dinner: { id: 'turkey-meatballs-marinara', servings: 1 }, snacks: { id: 'caprese-salad', servings: 0.5 } },
  thursday: { breakfast: { id: 'ful-medames', servings: 1 }, lunch: { id: 'salmon-poke-bowl', servings: 1 }, dinner: { id: 'custom:koshari', servings: 1 } },
  friday: { breakfast: { id: 'spinach-egg-muffins', servings: 1 }, lunch: { id: 'chicken-shawarma-plate', servings: 1 }, dinner: { id: 'spaghetti-pomodoro', servings: 1 }, snacks: { id: 'fresh-spring-rolls', servings: 0.5 } },
  saturday: { breakfast: { id: 'huevos-rancheros', servings: 1 }, lunch: { id: 'cobb-salad', servings: 1 }, dinner: { id: 'chicken-fajitas', servings: 1 } },
  sunday: { breakfast: { id: 'greek-yogurt-parfait', servings: 1 }, lunch: { id: 'minestrone-soup', servings: 1.5 }, dinner: { id: 'beef-broccoli-stir-fry', servings: 1.5 } },
});
const MEALS = [{ id: 'koshari', name: 'Mum’s koshari', kcal: 720, protein: 22, carbs: 128, fat: 14 }];
const DATA = { plan: WEEK, meals: MEALS, target: 2000, favorites: ['shakshuka', 'falafel-bowl', 'salmon-poke-bowl'] };

async function prepare(page, values = DATA, path = '/', { theme = 'light', motion = false } = {}) {
  await page.emulateMedia({ reducedMotion: motion ? 'no-preference' : 'reduce', colorScheme: theme });
  await seed(page, { ...values, theme });
  await open(page, path);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].filter((i) => i.loading !== 'lazy' || i.getBoundingClientRect().top < innerHeight).every((i) => i.complete));
}

const scrollTo = (page, selector, offset = 0) =>
  page.evaluate(
    ([sel, off]) => {
      const el = document.querySelector(sel);
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80 + off, behavior: 'instant' });
    },
    [selector, offset],
  );
const settle = (page, ms = 500) => page.waitForTimeout(ms);

test('hero (and the root gallery preview, and the social image)', async ({ page }) => {
  await prepare(page, {});
  await settle(page);
  await shot(page, 'hero');
  await page.setViewportSize({ width: 1280, height: 800 });
  await settle(page, 300);
  await page.screenshot({ path: '../docs/previews/nutriplan.jpg', type: 'jpeg', quality: 82 });
  await page.setViewportSize({ width: 1200, height: 630 });
  await settle(page, 300);
  await page.screenshot({ path: 'public/og.jpg', type: 'jpeg', quality: 80 });
});

test('recipes with filters', async ({ page }) => {
  await prepare(page, DATA, '/recipes');
  await page.getByTestId('chip-diet-high-protein').click();
  await page.getByTestId('max-kcal').fill('600');
  await expect(page.getByTestId('result-count')).not.toHaveText('30 recipes');
  await scrollTo(page, 'main section', -24);
  await settle(page, 800);
  await shot(page, 'recipes');
});

test('recipe detail with the macro donut', async ({ page }) => {
  await prepare(page, DATA, '/recipes/salmon-poke-bowl');
  await scrollTo(page, '#ingredients-title', -40);
  await settle(page, 1200);
  await shot(page, 'recipe');
});

test('a filled weekly planner', async ({ page }) => {
  await prepare(page, DATA, '/planner');
  await scrollTo(page, 'h1', -24);
  await settle(page);
  await shot(page, 'planner');
});

test('fill my week, explained', async ({ page }) => {
  await prepare(page, { target: 2000 }, '/planner');
  await page.getByTestId('fill-open').click();
  await page.getByTestId('fill-diet-vegetarian').click();
  await page.getByTestId('fill-run').click();
  await expect(page.getByTestId('fill-result')).toBeVisible();
  await settle(page);
  await shot(page, 'fill-my-week');
});

test('the shopping list', async ({ page }) => {
  await prepare(page, DATA, '/shopping');
  for (const item of ['lemon', 'cucumber', 'avocado', 'cherry-tomatoes']) await page.locator(`[data-item="${item}"]`).getByTestId('shopping-label').click();
  await page.getByTestId('extra-input').fill('Coffee beans');
  await page.getByTestId('extra-add').click();
  await scrollTo(page, '[data-testid="to-buy"]', -24);
  await settle(page);
  await shot(page, 'shopping');
});

test('cook mode', async ({ page }) => {
  await prepare(page, DATA, '/recipes/grilled-lemon-chicken-bowl', { motion: true });
  await page.getByTestId('cook-open').click();
  await page.getByTestId('cook-next').click();
  await page.getByTestId('cook-next').click();
  await page.getByTestId('cook-timer').click();
  await page.getByTestId('cook-ingredients-toggle').click();
  await page.waitForTimeout(2300);
  await shot(page, 'cook-mode');
});

test('the calculator', async ({ page }) => {
  await prepare(page, {}, '/calculator', { motion: true });
  await page.getByTestId('sex-female').check({ force: true });
  await page.getByTestId('age').fill('34');
  await page.getByTestId('heightCm').fill('168');
  await page.getByTestId('weightKg').fill('66');
  await page.getByTestId('activity').selectOption('moderate');
  await page.getByTestId('calculate').click();
  await page.getByTestId('goal-lose-slow').click();
  await page.waitForTimeout(1200);
  await scrollTo(page, 'h1', -20);
  await shot(page, 'calculator');
});

test('arabic', async ({ page }) => {
  await prepare(page, { ...DATA, meals: [{ ...MEALS[0], name: 'كشري ماما' }] }, '/ar/planner');
  await scrollTo(page, 'h1', -24);
  await settle(page);
  await shot(page, 'arabic');
  await prepare(page, DATA, '/ar/recipes/shakshuka');
  await scrollTo(page, 'h1', -420);
  await settle(page);
  await shot(page, 'arabic-recipe');
});

test('evening theme', async ({ page }) => {
  await prepare(page, DATA, '/recipes/falafel-bowl', { theme: 'dark' });
  await scrollTo(page, '#ingredients-title', -40);
  await settle(page, 1200);
  await shot(page, 'evening');
});

test('mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page, DATA, '/shopping');
  await page.locator('[data-item="lemon"]').getByTestId('shopping-label').click();
  await scrollTo(page, '[data-testid="to-buy"]', -12);
  await settle(page);
  await shot(page, 'mobile-shopping');
  await prepare(page, DATA, '/planner');
  await scrollTo(page, '#day-monday', -12);
  await settle(page);
  await shot(page, 'mobile-planner');
});
