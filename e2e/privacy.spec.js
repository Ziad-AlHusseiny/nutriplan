import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { open, planWith, seed, stored } from './helpers.js';

test('backup downloads everything; restore merges it back', async ({ page }) => {
  await seed(page, { plan: planWith({ monday: { lunch: { id: 'shakshuka', servings: 1 } } }), target: 1700, favorites: ['falafel-bowl'] });
  await open(page, '/privacy');
  await expect(page.getByTestId('saved-count')).toHaveText('3 things saved on this device.');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('download-backup').click()]);
  const backup = JSON.parse(await readFile(await download.path(), 'utf8'));
  expect(backup.app).toBe('nutriplan');
  expect(backup.data.target).toBe(1700);

  // Start fresh, then restore.
  await page.getByTestId('delete-all').click();
  await expect(page.getByRole('dialog', { name: 'Delete everything?' })).toBeVisible();
  await page.getByTestId('delete-confirm').click();
  await expect(page.getByTestId('saved-count')).toHaveText('Nothing is saved yet.');
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('nutriplan-')))).toEqual([]);

  await page.getByTestId('restore-input').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
  await expect(page.getByTestId('toast')).toContainText('Backup restored.');
  expect(await stored(page, 'target')).toBe(1700);
  expect(await stored(page, 'favorites')).toEqual(['falafel-bowl']);
});

test('a file that is not a backup is refused politely', async ({ page }) => {
  await open(page, '/privacy');
  await page.getByTestId('restore-input').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') });
  await expect(page.getByTestId('toast')).toContainText('isn’t a NutriPlan backup');
});

test('the page says plainly that nothing leaves the device, and that it is not medical advice', async ({ page }) => {
  await open(page, '/privacy');
  await expect(page.getByTestId('privacy-stored')).toContainText('Nothing is sent anywhere');
  await expect(page.getByTestId('privacy-advice')).toContainText('not medical or dietary advice');
  await expect(page.getByRole('contentinfo')).toContainText('not dietary advice');
});

test('no request ever leaves the site', async ({ page }) => {
  const external = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('http://localhost') && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) external.push(r.url());
  });
  for (const path of ['/', '/recipes', '/recipes/shakshuka', '/planner', '/shopping', '/calculator', '/ar']) await open(page, path);
  expect(external).toEqual([]);
});
