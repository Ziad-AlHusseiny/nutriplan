import { expect, test } from '@playwright/test';
import { isMobile, open, planWith, seed, stored, thisWeekKey } from './helpers.js';

const day = (page, d) => page.getByTestId(`day-${d}`);
const bar = (page, d) => day(page, d).getByTestId('day-bar');

test('empty week: banner, 2,000 kcal default target (PRD §6.4, §7)', async ({ page }) => {
  await open(page, '/planner');
  await expect(page.getByRole('heading', { name: 'Plan your first meal' })).toBeVisible();
  await expect(page.getByTestId('target-row')).toHaveText('Daily target: 2,000 kcal');
  await expect(bar(page, 'monday')).toContainText('0 / 2,000 kcal');
});

test('add a meal with the picker; Monday’s total goes up (PRD §6 AC)', async ({ page }) => {
  await open(page, '/planner');
  await day(page, 'monday').getByTestId('add-meal').first().click();
  const picker = page.getByTestId('picker');
  await expect(picker.getByRole('heading', { name: 'Add to Monday · Breakfast' })).toBeVisible();
  await expect(page.getByTestId('picker-search')).toBeFocused();
  await page.getByTestId('picker-search').fill('berry oats');
  await picker.getByTestId('picker-row').first().click();
  await expect(picker).toBeHidden();
  await expect(day(page, 'monday').getByTestId('planned-meal')).toContainText('Overnight Berry Oats');
  await expect(bar(page, 'monday')).toContainText('380 / 2,000 kcal');
  await expect(page.getByRole('heading', { name: 'Plan your first meal' })).toHaveCount(0);
});

test('the picker traps focus; Esc closes it and focus returns to "+ Add meal"', async ({ page }, testInfo) => {
  test.skip(isMobile(testInfo), 'hardware keyboard');
  await open(page, '/planner');
  const add = day(page, 'tuesday').getByTestId('add-meal').nth(1);
  await add.click();
  const picker = page.getByTestId('picker');
  await expect(picker.getByRole('heading', { name: 'Add to Tuesday · Lunch' })).toBeVisible();
  for (let i = 0; i < 50; i += 1) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => Boolean(document.activeElement.closest('[data-testid="picker"]')))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(picker).toBeHidden();
  await expect(add).toBeFocused();
});

test('remove, clear day (others untouched), and over-target in red', async ({ page }) => {
  await seed(page, {
    plan: planWith({
      monday: { breakfast: { id: 'shakshuka', servings: 1 }, lunch: { id: 'falafel-bowl', servings: 1 }, dinner: { id: 'turkey-chili', servings: 1 } },
      tuesday: { dinner: { id: 'custom:big', servings: 1 } },
    }),
    meals: [{ id: 'big', name: 'Big family lunch', kcal: 2220 }],
  });
  await open(page, '/planner');
  await expect(bar(page, 'monday')).toContainText('1,330 / 2,000 kcal');
  // Over target: red and "220 kcal over" (color is never the only signal).
  await expect(bar(page, 'tuesday')).toHaveAttribute('data-over', 'true');
  await expect(day(page, 'tuesday').getByTestId('over-caption')).toHaveText('220 kcal over');

  await day(page, 'monday').getByRole('button', { name: 'Remove Shakshuka from Monday breakfast' }).click();
  await expect(bar(page, 'monday')).toContainText('1,000 / 2,000 kcal');
  await day(page, 'monday').getByTestId('clear-day').click();
  await expect(bar(page, 'monday')).toContainText('0 / 2,000 kcal');
  await expect(day(page, 'monday').getByTestId('planned-meal')).toHaveCount(0);
  await expect(day(page, 'tuesday').getByTestId('planned-meal')).toHaveCount(1);
  // Undo brings the day back.
  await page.getByTestId('toast').getByRole('button', { name: 'Undo' }).click();
  await expect(bar(page, 'monday')).toContainText('1,000 / 2,000 kcal');
});

test('a planned week survives a reload (BRIEF criterion 6)', async ({ page }) => {
  await open(page, '/planner');
  await day(page, 'wednesday').getByTestId('add-meal').nth(2).click();
  await page.getByTestId('picker-search').fill('risotto');
  await page.getByTestId('picker-row').first().click();
  await expect(day(page, 'wednesday').getByTestId('planned-meal')).toContainText('Creamy Mushroom Risotto');
  await page.reload();
  await expect(day(page, 'wednesday').getByTestId('planned-meal')).toContainText('Creamy Mushroom Risotto');
  const plan = await stored(page, 'plan');
  expect(plan.weeks[thisWeekKey()].wednesday.dinner).toEqual({ id: 'mushroom-risotto', servings: 1 });
});

test('invalid JSON in nutriplan-plan: an empty week, and the key is rewritten (PRD §6.5)', async ({ page }) => {
  await seed(page, { plan: '{not json' });
  await open(page, '/planner');
  await expect(page.getByRole('heading', { name: 'Plan your first meal' })).toBeVisible();
  expect(await stored(page, 'plan')).toEqual({ version: 2, weeks: {} });
});

test('the same recipe can sit in several slots', async ({ page }) => {
  await seed(page, { plan: planWith({ monday: { lunch: { id: 'shakshuka', servings: 1 } } }) });
  await open(page, '/planner');
  await day(page, 'thursday').getByTestId('add-meal').first().click();
  await page.getByTestId('picker-search').fill('shakshuka');
  await page.getByTestId('picker-row').first().click();
  await expect(page.getByTestId('planned-meal').filter({ hasText: 'Shakshuka' })).toHaveCount(2);
});

test('Fill my week fills the empty slots on target, explains itself, and can be undone', async ({ page }) => {
  await seed(page, { plan: planWith({ monday: { dinner: { id: 'turkey-chili', servings: 1 } } }) });
  await open(page, '/planner');
  await page.getByTestId('fill-open').click();
  await page.getByTestId('fill-diet-vegetarian').click();
  await page.getByTestId('fill-run').click();
  const result = page.getByTestId('fill-result');
  await expect(result).toContainText('Filled');
  await expect(result.getByText(/on target/).first()).toBeVisible();
  // The chili stays where it was.
  await expect(day(page, 'monday').getByTestId('planned-meal').filter({ hasText: 'Turkey and Bean Chili' })).toHaveCount(1);
  const plan = await stored(page, 'plan');
  const filled = Object.values(plan.weeks[thisWeekKey()]).flatMap((d) => Object.values(d)).filter(Boolean);
  expect(filled.length).toBeGreaterThan(10);
  await page.getByTestId('fill-undo').click();
  await expect(page.getByTestId('planned-meal')).toHaveCount(1);
});

test('copy a day, move and swap meals from the keyboard-friendly sheet', async ({ page }) => {
  await seed(page, { plan: planWith({ monday: { breakfast: { id: 'ful-medames', servings: 1 }, dinner: { id: 'red-lentil-soup', servings: 2 } } }) });
  await open(page, '/planner');
  await day(page, 'monday').getByTestId('copy-day').click();
  await page.getByTestId('copy-to-tuesday').check();
  await page.getByTestId('copy-to-wednesday').check();
  await page.getByTestId('copy-confirm').click();
  await expect(day(page, 'wednesday').getByTestId('planned-meal')).toHaveCount(2);

  await day(page, 'monday').getByTestId('slot-monday-dinner').getByTestId('edit-meal').click();
  const sheet = page.getByTestId('meal-sheet');
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: 'Increase servings' }).click();
  await expect(sheet.getByTestId('sheet-servings-value')).toHaveText('2.5');
  // Swap Monday dinner with Monday breakfast.
  await sheet.getByTestId('move-monday-breakfast').click();
  await expect(page.getByTestId('slot-monday-breakfast').getByTestId('planned-title')).toHaveText('Red Lentil Soup');
  await expect(page.getByTestId('slot-monday-dinner').getByTestId('planned-title')).toHaveText('Ful Medames');
  await expect(page.getByTestId('toast')).toContainText('Swapped');
});

test('repeat last week copies into empty slots only', async ({ page }) => {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  const plan = planWith({ tuesday: { lunch: { id: 'cobb-salad', servings: 1 } } }, thisWeekKey(last));
  plan.weeks[thisWeekKey()] = planWith({ tuesday: { lunch: { id: 'shakshuka', servings: 1 } }, friday: {} }).weeks[thisWeekKey()];
  plan.weeks[thisWeekKey(last)].friday.dinner = { id: 'chicken-fajitas', servings: 2 };
  await seed(page, { plan });
  await open(page, '/planner');
  await page.getByTestId('repeat-week').click();
  await expect(page.getByTestId('toast')).toContainText('Copied 1 meal from last week.');
  await expect(page.getByTestId('slot-tuesday-lunch').getByTestId('planned-title')).toHaveText('Shakshuka');
  await expect(page.getByTestId('slot-friday-dinner').getByTestId('planned-title')).toHaveText('Sheet-Pan Chicken Fajitas');
});

test('your own meal: create it from the picker and plan it', async ({ page }) => {
  await open(page, '/planner');
  await day(page, 'friday').getByTestId('add-meal').nth(2).click();
  await page.getByTestId('picker-tab-mine').click();
  await page.getByTestId('picker-new-meal').click();
  const dialog = page.getByTestId('custom-meal');
  await page.getByTestId('meal-save').click();
  await expect(dialog.getByText('Give it a name.')).toBeVisible();
  await page.getByTestId('meal-name').fill('Mum’s koshari');
  await page.getByTestId('meal-kcal').fill('720');
  await page.getByTestId('meal-protein').fill('22');
  await page.getByTestId('meal-save').click();
  await expect(page.getByTestId('slot-friday-dinner').getByTestId('planned-title')).toHaveText('Mum’s koshari');
  await expect(bar(page, 'friday')).toContainText('720 / 2,000 kcal');
});

test('weeks: next week is its own plan; "Back to this week" returns', async ({ page }) => {
  await seed(page, { plan: planWith({ monday: { lunch: { id: 'shakshuka', servings: 1 } } }) });
  await open(page, '/planner');
  await page.getByTestId('week-next').click();
  await expect(page.getByTestId('week-name')).toHaveText('Next week');
  await expect(page.getByTestId('planned-meal')).toHaveCount(0);
  await page.getByRole('button', { name: 'Back to this week' }).click();
  await expect(page.getByTestId('planned-meal')).toHaveCount(1);
});

test('edit targets by hand: the bars follow', async ({ page }) => {
  await open(page, '/planner');
  await page.getByTestId('edit-targets').click();
  await page.getByTestId('target-kcal').fill('1800');
  await page.getByTestId('targets-save').click();
  await expect(page.getByTestId('target-row')).toHaveText('Daily target: 1,800 kcal');
  await expect(bar(page, 'monday')).toContainText('0 / 1,800 kcal');
  expect(await stored(page, 'target')).toBe(1800);
});

test('on Sunday, the planner offers next week', async ({ page }) => {
  // Sunday 11 October 2026, 7pm.
  await page.clock.setFixedTime(new Date(2026, 9, 11, 19, 0));
  await open(page, '/planner');
  await page.getByTestId('plan-next-week').click();
  await expect(page.getByTestId('week-name')).toHaveText('Next week');
  await expect(page.getByTestId('plan-next-week')).toHaveCount(0);
});
