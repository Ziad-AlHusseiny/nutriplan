#!/usr/bin/env node
// Fails if a page's first-load JavaScript exceeds the BRIEF budget
// (success criterion 4: initial JS ≤ 180 KB gzipped). "Initial" is what
// each prerendered page loads before it's interactive: the entry, its
// imports, and the page's own preloaded chunk (and, on /ar pages, the
// Arabic text). Lazy chunks are listed but not counted.
//
//   npm run check:bundle   (after npm run build)

import { readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const BUDGET_KB = 180;
const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

const gz = new Map();
const gzKB = async (file) => {
  if (!gz.has(file)) gz.set(file, gzipSync(await readFile(join(DIST, file)), { level: 9 }).length / 1024);
  return gz.get(file);
};

const PAGES = { '/': 'index.html', '/recipes': 'recipes/index.html', '/recipes/:id': 'recipes/grilled-lemon-chicken-bowl/index.html', '/planner': 'planner/index.html', '/shopping': 'shopping/index.html', '/calculator': 'calculator/index.html', '/privacy': 'privacy/index.html', '/ar': 'ar/index.html', '/ar/planner': 'ar/planner/index.html' };
// Each page must preload its own chunk (otherwise it hydrates late, and this budget would miss it).
const PAGE_CHUNK = { '/': 'HomePage', '/recipes': 'RecipesPage', '/recipes/:id': 'RecipeDetailPage', '/planner': 'PlannerPage', '/shopping': 'ShoppingPage', '/calculator': 'CalculatorPage', '/privacy': 'PrivacyPage', '/ar': 'HomePage', '/ar/planner': 'PlannerPage' };

let worst = 0;
const initialFiles = new Set();
for (const [route, file] of Object.entries(PAGES)) {
  let html;
  try {
    html = await readFile(join(DIST, file), 'utf8');
  } catch {
    console.error(`dist/${file} not found — run \`npm run build\` first.`);
    process.exit(1);
  }
  const scripts = new Set();
  for (const [, src] of html.matchAll(/<script[^>]+src="\/([^"]+\.js)"/g)) scripts.add(src);
  for (const [, href] of html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="\/([^"]+\.js)"/g)) scripts.add(href);
  if (![...scripts].some((f) => f.startsWith(`assets/${PAGE_CHUNK[route]}-`))) {
    console.error(`${route}: the page's own chunk (${PAGE_CHUNK[route]}) isn't preloaded.`);
    process.exit(1);
  }
  let kb = 0;
  for (const s of scripts) {
    kb += await gzKB(s);
    initialFiles.add(s);
  }
  const htmlKB = gzipSync(html, { level: 9 }).length / 1024;
  worst = Math.max(worst, kb);
  console.log(`${kb.toFixed(1).padStart(7)} KB gz  ${route.padEnd(14)} initial JavaScript   (HTML ${htmlKB.toFixed(1)} KB gz, CSS inlined)`);
}

const all = (await readdir(join(DIST, 'assets'))).filter((f) => f.endsWith('.js'));
let total = 0;
for (const f of all) total += await gzKB(`assets/${f}`);
console.log(`${total.toFixed(1).padStart(7)} KB gz  all JavaScript, ${all.length} chunks (lazy ones load on demand)`);
console.log(`${worst.toFixed(1).padStart(7)} KB gz  heaviest first load (budget ${BUDGET_KB} KB)`);
if (worst > BUDGET_KB) {
  console.error(`A page's initial JavaScript exceeds the ${BUDGET_KB} KB budget by ${(worst - BUDGET_KB).toFixed(1)} KB.`);
  process.exit(1);
}
