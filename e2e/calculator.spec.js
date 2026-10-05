import { expect, test } from '@playwright/test';
import { isMobile, open, stored } from './helpers.js';

async function fillExample(page) {
  await page.getByTestId('sex-female').check({ force: true });
  await page.getByTestId('age').fill('30');
  await page.getByTestId('heightCm').fill('165');
  await page.getByTestId('weightKg').fill('60');
  await page.getByTestId('activity').selectOption('moderate');
}

test('PRD worked example: BMR 1,320, TDEE 2,046; lose −500 → 1,550', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/calculator');
  await expect(page.getByTestId('results-empty')).toBeVisible();
  await fillExample(page);
  await page.getByTestId('calculate').click();
  await expect(page.getByTestId('bmr')).toHaveText('1,320');
  await expect(page.getByTestId('tdee')).toHaveText('2,046');
  await expect(page.getByTestId('goal-maintain')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('target')).toHaveText('2,050 kcal');
  await page.getByTestId('goal-lose').click();
  await expect(page.getByTestId('target')).toHaveText('1,550 kcal');
});

test('the count-up lands on the right numbers with motion on', async ({ page }) => {
  await open(page, '/calculator');
  await fillExample(page);
  await page.getByTestId('calculate').click();
  await expect(page.getByTestId('tdee')).toHaveText('2,046');
});

test('validation: age 12 is refused with the PRD message; first invalid field focused', async ({ page }) => {
  await open(page, '/calculator');
  await fillExample(page);
  await page.getByTestId('age').fill('12');
  await page.getByTestId('calculate').click();
  await expect(page.getByTestId('age-error')).toHaveText('Enter an age between 15 and 90.');
  await expect(page.getByTestId('age')).toBeFocused();
  await expect(page.getByTestId('results-empty')).toBeVisible();
  await page.reload();
  await page.getByTestId('calculate').click();
  await expect(page.getByTestId('sex-error')).toHaveText('Pick an option.');
  await expect(page.getByText('This field is required.')).toHaveCount(4);
});

test('saving the target updates the planner (and the default is 2,000)', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/calculator');
  await fillExample(page);
  await page.getByTestId('calculate').click();
  await page.getByTestId('goal-lose').click();
  await page.getByTestId('save-target').click();
  await expect(page.getByTestId('saved')).toContainText('Saved — your planner now tracks 1,550 kcal.');
  expect(await stored(page, 'target')).toBe(1550);
  await page.getByRole('link', { name: 'Open planner →' }).click();
  await expect(page.getByTestId('target-row')).toHaveText('Daily target: 1,550 kcal');
  await expect(page.getByTestId('day-monday').getByTestId('day-bar')).toContainText('0 / 1,550 kcal');
  if (!isMobile(testInfo)) await expect(page.getByTestId('day-monday')).toContainText('Protein');
});

test('results stay until Calculate is pressed again (no live recompute)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/calculator');
  await fillExample(page);
  await page.getByTestId('calculate').click();
  await page.getByTestId('weightKg').fill('80');
  await expect(page.getByTestId('bmr')).toHaveText('1,320');
  await expect(page.getByText('You changed the form.')).toBeVisible();
  await page.getByTestId('calculate').click();
  await expect(page.getByTestId('bmr')).toHaveText('1,520');
});

test('US units give the same answer', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/calculator');
  await page.getByTestId('calc-us').check({ force: true });
  await page.getByTestId('sex-female').check({ force: true });
  await page.getByTestId('age').fill('30');
  await page.getByTestId('ft').fill('5');
  await page.getByTestId('in').fill('5');
  await page.getByTestId('lb').fill('132');
  await page.getByTestId('activity').selectOption('moderate');
  await page.getByTestId('calculate').click();
  await expect(page.getByTestId('bmr')).toHaveText(/1,3[12]\d/);
});

test('safety: floors, a note for under-18s, and the support links are always there', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/calculator');
  await expect(page.getByTestId('safety-notes')).toContainText('Pregnant, breastfeeding');
  await expect(page.getByTestId('safety-notes').getByRole('link', { name: /findahelpline\.com/ })).toHaveAttribute('href', 'https://findahelpline.com');
  // A small, older, sedentary woman: −500 would go under 1,200.
  await page.getByTestId('sex-female').check({ force: true });
  await page.getByTestId('age').fill('70');
  await page.getByTestId('heightCm').fill('150');
  await page.getByTestId('weightKg').fill('48');
  await page.getByTestId('activity').selectOption('sedentary');
  await page.getByTestId('calculate').click();
  await page.getByTestId('goal-lose').click();
  await expect(page.getByTestId('target')).toHaveText('1,200 kcal');
  await expect(page.getByTestId('safety-warnings')).toContainText('held your target at 1,200 kcal');
  // Under 18: no weight-loss goals.
  await page.getByTestId('age').fill('16');
  await page.getByTestId('calculate').click();
  await expect(page.getByTestId('goal-lose')).toBeDisabled();
  await expect(page.getByTestId('safety-warnings')).toContainText('Under 18');
});
