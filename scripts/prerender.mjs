#!/usr/bin/env node
// Writes the static pages after `vite build` (client) and
// `vite build --ssr src/entry-server.jsx` (prerender bundle):
//
//   dist/index.html, dist/recipes/index.html, dist/recipes/<id>/index.html …
//   dist/ar/index.html, dist/ar/recipes/index.html …   (Arabic, right to left)
//   dist/404.html                                     (unknown addresses)
//   dist/sw.js                                        (the offline service worker)
//
// Every page paints from this HTML (CSS inlined, fonts and the page's own
// chunk preloaded, the hero photo preloaded on Home); React hydrates it when
// the script arrives.

import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SSR = join(ROOT, 'dist-ssr');
export const SITE_URL = 'https://nutriplan-lf-2.vercel.app';

const escapeAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escapeText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

const template = await readFile(join(DIST, 'index.html'), 'utf8');
const manifest = JSON.parse(await readFile(join(DIST, '.vite', 'manifest.json'), 'utf8'));
const server = await import(pathToFileURL(join(SSR, 'entry-server.js')).href);
const assets = await readdir(join(DIST, 'assets'));
const asset = (re) => assets.find((name) => re.test(name));

// Inline the stylesheet: no render-blocking request before the first paint.
const cssHref = template.match(/<link rel="stylesheet"[^>]*href="\/(assets\/[^"]+\.css)"[^>]*>/);
const css = cssHref ? await readFile(join(DIST, cssHref[1]), 'utf8') : '';

// Chunks the template already loads (the entry and its static imports).
const inTemplate = new Set([...template.matchAll(/(?:src|href)="\/(assets\/[^"]+\.js)"/g)].map((m) => m[1]));

/**
 * A module's manifest entry. When Rollup merges a page into a shared chunk
 * (the planner and its lazy dialogs), the entry is keyed by the chunk
 * ("_PlannerPage-….js") rather than the source path: find it by name.
 */
const entryOf = (key) => manifest[key] ?? Object.values(manifest).find((e) => key.startsWith('src/') && e.name === key.split('/').pop().replace(/\.[jt]sx?$/, ''));

/** A source module's chunk and every chunk it statically imports. */
function chunksOf(src, seen = new Set()) {
  const entry = entryOf(src);
  if (!entry || seen.has(entry.file)) return seen;
  seen.add(entry.file);
  for (const dep of entry.imports ?? []) chunksOf(dep, seen);
  return seen;
}
const modulePreloads = (srcs) =>
  [...new Set(srcs.flatMap((src) => [...chunksOf(src)]))]
    .filter((file) => !inTemplate.has(file))
    .map((file) => `<link rel="modulepreload" crossorigin href="/${file}" />`);

const PAGE_SOURCES = {
  home: 'src/pages/HomePage.jsx',
  recipes: 'src/pages/RecipesPage.jsx',
  recipe: 'src/pages/RecipeDetailPage.jsx',
  planner: 'src/pages/PlannerPage.jsx',
  shopping: 'src/pages/ShoppingPage.jsx',
  calculator: 'src/pages/CalculatorPage.jsx',
  privacy: 'src/pages/PrivacyPage.jsx',
  notFound: 'src/pages/NotFoundPage.jsx',
};
const ARABIC_SOURCES = ['src/i18n/ar.js', 'src/data/recipes.ar.js', 'src/data/ingredients.ar.js'];

const fontPreload = (re) => {
  const name = asset(re);
  return name ? `<link rel="preload" href="/assets/${name}" as="font" type="font/woff2" crossorigin />` : '';
};

const localized = (path, locale) => (locale === 'ar' ? (path === '/' ? '/ar' : `/ar${path}`) : path);
const fileFor = (url) => (url === '/' ? join(DIST, 'index.html') : join(DIST, url.slice(1), 'index.html'));

async function writePage(locale, path, { file, url = localized(path, locale), dataPath = path } = {}) {
  const page = await server.render(locale, path);
  const alternates = path === server.notFoundPath ? [] : server.locales.map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE_URL}${localized(path, l)}" />`);
  const hero = page.page === 'home' ? server.heroImage() : null;
  const photo = page.page === 'recipe' ? server.recipeImage(path) : null;
  const head = [
    `<title>${escapeText(page.title)}</title>`,
    `<meta name="description" content="${escapeAttr(page.description)}" />`,
    `<meta property="og:title" content="${escapeAttr(page.title)}" />`,
    `<meta property="og:description" content="${escapeAttr(page.description)}" />`,
    `<meta property="og:url" content="${SITE_URL}${url}" />`,
    `<meta property="og:image" content="${SITE_URL}${page.image}" />`,
    `<meta property="og:locale" content="${locale === 'ar' ? 'ar_EG' : 'en_US'}" />`,
    path === server.notFoundPath ? '<meta name="robots" content="noindex" />' : `<link rel="canonical" href="${SITE_URL}${url}" />`,
    ...alternates,
    alternates.length ? `<link rel="alternate" hreflang="x-default" href="${SITE_URL}${path}" />` : '',
    `<link rel="manifest" href="${locale === 'ar' ? '/manifest-ar.webmanifest' : '/manifest.webmanifest'}" />`,
    // The hero photo is the largest paint on Home: fetch it with the HTML.
    hero ? `<link rel="preload" as="image" type="image/avif" imagesrcset="${hero.avif}" imagesizes="${server.HERO_SIZES}" fetchpriority="high" />` : '',
    photo ? `<link rel="preload" as="image" type="image/avif" imagesrcset="${photo.avif}" imagesizes="${server.RECIPE_HERO_SIZES}" fetchpriority="high" />` : '',
    fontPreload(/^bricolage-grotesque-latin-wght-normal-.*\.woff2$/),
    fontPreload(/^figtree-latin-wght-normal-.*\.woff2$/),
    locale === 'ar' ? fontPreload(/^alexandria-arabic-wght-normal-.*\.woff2$/) : '',
    locale === 'ar' ? fontPreload(/^readex-pro-arabic-wght-normal-.*\.woff2$/) : '',
    ...modulePreloads([PAGE_SOURCES[page.page], ...(locale === 'ar' ? ARABIC_SOURCES : [])]),
  ]
    .filter(Boolean)
    .join('\n    ');

  let html = template
    .replace('<html lang="en" dir="ltr"', `<html lang="${page.lang}" dir="${page.dir}"`)
    .replace('<!--app-head-->', head)
    .replace('<div id="root"><!--app-html--></div>', `<div id="root" data-locale="${locale}" data-path="${dataPath}">${page.html}</div>`);
  if (cssHref) html = html.replace(cssHref[0], `<style>${css}</style>`);

  const out = file ?? fileFor(url);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, html);
  return Buffer.byteLength(html);
}

let pages = 0;
let bytes = 0;
for (const locale of server.locales) {
  for (const path of server.paths) {
    bytes += await writePage(locale, path);
    pages += 1;
  }
}
// Unknown addresses: Vercel serves 404.html; the app then routes on the client.
bytes += await writePage('en', server.notFoundPath, { file: join(DIST, '404.html'), url: '/404' });
console.log(`[prerender] ${pages} pages + 404.html (${(bytes / 1024 / pages).toFixed(1)} KB average)`);

// ── Service worker: precache what the app needs to run offline. ──
// Every script, font, icon and the app pages in both languages; small photos
// (the planner and list thumbnails). Recipe pages and big photos are cached
// as they're visited.
const SHELL = ['/', '/recipes', '/planner', '/shopping', '/calculator', '/privacy'];
const shellFiles = new Set(server.locales.flatMap((l) => SHELL.map((p) => relative(DIST, fileFor(localized(p, l))).split('\\').join('/'))));
const SKIP = [/^sw\.js$/, /\.map$/, /^og\.jpg$/, /^robots\.txt$/, /^sitemap\.xml$/, /^\.vite\//, /^404\.html$/];
const files = (await walk(DIST))
  .map((f) => relative(DIST, f).split('\\').join('/'))
  .filter((f) => !SKIP.some((re) => re.test(f)) && !f.startsWith('.'))
  .filter((f) => !(cssHref && f === cssHref[1]))
  .filter((f) => (f.endsWith('.html') ? shellFiles.has(f) : true))
  .filter((f) => !/\.(avif|webp)$/.test(f) || /-(160|480)-[\w-]+\.avif$/.test(f))
  .sort();
const hash = createHash('sha256');
for (const f of files) hash.update(f).update(await readFile(join(DIST, f)));
const version = hash.digest('hex').slice(0, 12);
const urls = files.map((f) => (f.endsWith('index.html') ? `/${f.slice(0, -'index.html'.length)}`.replace(/(.)\/$/, '$1') : `/${f}`));
const sw = (await readFile(join(ROOT, 'scripts', 'sw.template.js'), 'utf8'))
  .replace("'__VERSION__'", JSON.stringify(version))
  .replace("['__PRECACHE__']", JSON.stringify(urls, null, 2));
await writeFile(join(DIST, 'sw.js'), sw);
let precached = 0;
for (const f of files) precached += (await stat(join(DIST, f))).size;
console.log(`[prerender] sw.js: ${urls.length} files precached (${(precached / 1024).toFixed(0)} KB), version ${version}`);

// The sitemap: every page in both languages.
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${server.locales
  .flatMap((l) => server.paths.map((p) => `  <url><loc>${SITE_URL}${localized(p, l)}</loc></url>`))
  .join('\n')}\n</urlset>\n`;
await writeFile(join(DIST, 'sitemap.xml'), sitemap);

await rm(SSR, { recursive: true, force: true });
await rm(join(DIST, '.vite'), { recursive: true, force: true });
