#!/usr/bin/env node
// Downloads the photos listed in scripts/image-sources.json (Unsplash and
// Pexels originals, credited in docs/CREDITS.md) and writes responsive
// AVIF and WebP files, cropped to 4:3:
//
//   src/assets/photos/<id>-<width>.avif|webp
//
// Recipes get 160 (thumbnails), 480, 800 and 1200 px; the home hero 640–1600.
// Originals are cached in .cache/photos/ so re-runs are fast.
//
//   npm run images            (all)       node scripts/images.mjs shakshuka   (one)

import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src', 'assets', 'photos');
const CACHE = join(ROOT, '.cache', 'photos');
const sources = JSON.parse(await readFile(join(ROOT, 'scripts', 'image-sources.json'), 'utf8'));
const only = process.argv.slice(2);

const WIDTHS = { recipe: [160, 480, 800, 1200], hero: [640, 960, 1280, 1600] };
const POSITIONS = { center: 'centre', top: 'north', bottom: 'south', left: 'west', right: 'east', north: 'north', south: 'south', east: 'east', west: 'west', attention: sharp.strategy.attention, entropy: sharp.strategy.entropy };

await mkdir(OUT, { recursive: true });
await mkdir(CACHE, { recursive: true });

async function original(entry) {
  const file = join(CACHE, `${entry.id}.jpg`);
  if (existsSync(file)) return file;
  const res = await fetch(entry.source, { headers: { 'User-Agent': 'NutriPlan image script (portfolio project)' } });
  if (!res.ok) throw new Error(`${entry.id}: HTTP ${res.status} for ${entry.source}`);
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
  return file;
}

for (const entry of sources) {
  if (only.length && !only.includes(entry.id)) continue;
  const kind = entry.id === 'home-hero' ? 'hero' : 'recipe';
  const input = await original(entry);
  // Remove this photo's old sizes first.
  for (const f of await readdir(OUT)) if (f.startsWith(`${entry.id}-`) && /^\D/.test(f.slice(entry.id.length + 1)) === false) await rm(join(OUT, f));
  const base = sharp(input).rotate();
  const meta = await base.metadata();
  let bytes = 0;
  for (const width of WIDTHS[kind]) {
    const height = Math.round((width * 3) / 4);
    const pipeline = sharp(input)
      .rotate()
      .resize({ width, height, fit: 'cover', position: POSITIONS[entry.focus ?? 'center'] ?? 'centre' })
      .modulate({ saturation: 1.02 })
      .sharpen({ sigma: width <= 480 ? 0.6 : 0.4 });
    // Quality steps down until the file fits its budget (DESIGN-SYSTEM §6:
    // ≤ 180 KB per recipe photo, ≤ 220 KB for the hero).
    const budget = kind === 'hero' ? 220 * 1024 : 180 * 1024;
    let q = kind === 'hero' ? 44 : width <= 480 ? 52 : 48;
    let avif = await pipeline.clone().avif({ quality: q, effort: 6, chromaSubsampling: '4:2:0' }).toBuffer();
    while (avif.length > budget * 0.7 && q > 30) {
      q -= 4;
      avif = await pipeline.clone().avif({ quality: q, effort: 6, chromaSubsampling: '4:2:0' }).toBuffer();
    }
    q = kind === 'hero' ? 66 : width <= 480 ? 76 : 72;
    let webp = await pipeline.clone().webp({ quality: q, effort: 6 }).toBuffer();
    while (webp.length > budget && q > 28) {
      q -= 4;
      webp = await pipeline.clone().webp({ quality: q, effort: 6 }).toBuffer();
    }
    await writeFile(join(OUT, `${entry.id}-${width}.avif`), avif);
    await writeFile(join(OUT, `${entry.id}-${width}.webp`), webp);
    bytes += avif.length + webp.length;
  }
  console.log(`${entry.id.padEnd(28)} ${meta.width}×${meta.height} → ${WIDTHS[kind].join('/')} (${(bytes / 1024).toFixed(0)} KB)`);
}
const files = await readdir(OUT);
let size = 0;
for (const f of files) size += (await stat(join(OUT, f))).size;
console.log(`[images] ${files.length} files, ${(size / 1024 / 1024).toFixed(1)} MB in src/assets/photos`);
