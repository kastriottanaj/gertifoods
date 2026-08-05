// Post-build step: inline the CSS each page actually uses, and load the rest
// asynchronously.
//
// Astro emits two stylesheets — BaseLayout.css (~50 KB, the whole site's rules,
// because src/App.css is one file covering every page) and Home.css (~24 KB).
// Both are <link rel="stylesheet">, so both block the first paint on every
// page, including /imprint which uses a small fraction of them.
//
// Beasties rewrites each built HTML file: rules whose selectors match that
// document go into an inline <style>, and the original <link> becomes a
// non-blocking preload that swaps to a stylesheet once loaded. A <noscript>
// fallback keeps the plain <link> for clients without JavaScript.
//
// This treats the symptom. The cause is that App.css is not split per route, so
// every page downloads every page's rules. Splitting it would remove the bytes
// rather than relocate them; this step is worth keeping either way, but it is
// not a substitute for that.
import { readFile, writeFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Beasties from 'beasties';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

const beasties = new Beasties({
  path: DIST,
  publicPath: '/',
  // Inline the rules this document uses and drop the rest from the critical
  // block; the full stylesheet still arrives asynchronously.
  pruneSource: false,
  // Swap the render-blocking <link> for a preload that applies on load.
  preload: 'swap',
  // Keep @font-face out of the critical block — there are no web fonts on this
  // site, but this stops a future one from bloating every page's <head>.
  inlineFonts: false,
  preloadFonts: false,
  logLevel: 'silent',
});

let pages = 0;
let inlinedTotal = 0;
let htmlBefore = 0;
let htmlAfter = 0;

for await (const file of glob('**/*.html', { cwd: DIST })) {
  const path = join(DIST, file);
  const html = await readFile(path, 'utf8');
  const processed = await beasties.process(html);

  htmlBefore += Buffer.byteLength(html);
  htmlAfter += Buffer.byteLength(processed);
  inlinedTotal += [...processed.matchAll(/<style>([\s\S]*?)<\/style>/g)].reduce(
    (n, m) => n + m[1].length,
    0
  );

  await writeFile(path, processed);
  pages += 1;
}

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
console.log(
  `critical CSS: ${pages} pages, ${kb(inlinedTotal / pages)} inlined per page on average, ` +
    `HTML ${kb(htmlBefore)} -> ${kb(htmlAfter)}`
);
