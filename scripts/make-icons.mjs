#!/usr/bin/env node
// One-off: draws the PWA icons (public/icons/*.png) with Playwright.
//   node scripts/make-icons.mjs

import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
// lucide "leaf", in the brand green.
const LEAF = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`;

const page = (size, { radius, glyph }) => `<!doctype html><html><body style="margin:0;background:transparent">
<div style="width:${size}px;height:${size}px;border-radius:${radius}px;overflow:hidden;position:relative;
  background: radial-gradient(closest-side, rgba(249,115,22,.55), transparent) 115% -20% / 75% 75% no-repeat,
              linear-gradient(160deg, #22c55e 0%, #16a34a 55%, #15803d 100%);
  display:grid;place-items:center">
  <div style="width:${size * glyph}px;height:${size * glyph}px">${LEAF}</div>
</div></body></html>`;

const ICONS = [
  { file: 'icon-192.png', size: 192, radius: 42, glyph: 0.56 },
  { file: 'icon-512.png', size: 512, radius: 112, glyph: 0.56 },
  { file: 'maskable-512.png', size: 512, radius: 0, glyph: 0.44 },
  { file: 'apple-touch-icon.png', size: 180, radius: 0, glyph: 0.52 },
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
for (const icon of ICONS) {
  const p = await browser.newPage({ viewport: { width: icon.size, height: icon.size } });
  await p.setContent(page(icon.size, icon));
  await p.screenshot({ path: join(OUT, icon.file), omitBackground: true });
  await p.close();
  console.log(icon.file);
}
await browser.close();
