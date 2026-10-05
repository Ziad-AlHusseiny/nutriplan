#!/usr/bin/env node
// Writes docs/CREDITS.md from scripts/image-sources.json (run after
// changing a photo): every photo with its photographer, source and license,
// plus the fonts and icons.
//
//   node scripts/credits.mjs

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const sources = JSON.parse(await readFile(join(ROOT, 'scripts', 'image-sources.json'), 'utf8'));

const site = (url) => (url.includes('pexels.com') ? 'Pexels' : 'Unsplash');
const rows = sources.map((s) => {
  const who = s.photographer ? (s.photographerUrl ? `[${s.photographer}](${s.photographerUrl})` : s.photographer) : 'Unknown';
  return `| \`${s.id}\` | ${who} | [${site(s.pageUrl)}](${s.pageUrl}) | ${s.license} |`;
});

const md = `# Credits

## Photography

Every photo is free to use under its site's license, downloaded (never hotlinked) and served as AVIF and WebP at several sizes (\`npm run images\`, from \`scripts/image-sources.json\`, which also describes each one). Thank you to the photographers.

| Photo | Photographer | Source | License |
|---|---|---|---|
${rows.join('\n')}

## Fonts

Self-hosted from the [Fontsource](https://fontsource.org) builds, all under the [SIL Open Font License 1.1](https://openfontlicense.org):

- **Bricolage Grotesque** by Mathieu Triay: variable, latin subset (headings and numbers)
- **Figtree** by Erik Kennedy: variable, latin subset (body text)
- **Alexandria** by Mohamed Gaber: variable, Arabic subset (Arabic headings)
- **Readex Pro** by Thomas Jockin, Nadine Chahine and Bonnie Shaver-Troup: variable, Arabic subset (Arabic body text)

## Sound

None. The timer chime is synthesised in the browser by \`src/lib/chime.js\` (Web Audio).

## Icons

[Lucide](https://lucide.dev) (ISC License). The GitHub mark in the developer credit is GitHub's.

## Data

The 30 recipes, their steps and their nutrition values were written for this project. Macros are careful per-serving estimates for planning (checked against the 4/4/9 rule), not laboratory values and not dietary advice.
`;
await writeFile(join(ROOT, 'docs', 'CREDITS.md'), md);
console.log(`docs/CREDITS.md: ${sources.length} photos`);
