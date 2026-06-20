// Post-build prerender step.
//
// This is a client-side SPA (no SSR), so the canonical tag, <title> and meta
// description are normally injected at runtime by react-helmet-async — they
// only exist *after* JavaScript runs. Crawlers and SEO audit tools that read
// the raw HTML (and Google's first indexing wave) therefore see no canonical
// at all, which hurts SEO.
//
// To fix that without adding SSR or a headless browser (the build runs on the
// server with Node only), we copy the built dist/index.html into a per-route
// HTML file and bake the correct <title>/description/canonical/og tags into the
// <head>. Every injected tag carries data-rh="true" — the attribute
// react-helmet-async uses to recognise its own tags — so when the client app
// mounts it reconciles (replaces) these tags instead of appending a second,
// duplicate canonical (which Google would ignore).
//
// Runs automatically as part of `npm run build` (see package.json). Routes are
// kept in sync with config/sitemaps.py.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import translations from './src/i18n/translations.js';
import { areas } from './src/data/areas.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, 'dist');
const BASE_URL = 'https://gertifoods.com';

// Prerendered pages use the site's default language (the same one index.html
// declares with <html lang="sq">), which is what a first-load crawler sees.
// All three languages share one URL per page, so there is one canonical each.
const LANG = 'sq';
const OG_LOCALE = 'sq_AL';
const t = (key) => translations[LANG]?.[key] || key;

// Mirror SEO.jsx: title ? `${title} | Gerti Foods` : 'Gerti Foods'.
const fullTitle = (title) => (title ? `${title} | Gerti Foods` : 'Gerti Foods');

// Routes to prerender — keep in sync with config/sitemaps.py.
const routes = [
  { path: '/', title: t('home_title'), description: t('home_meta') },
  { path: '/products', title: t('products_title'), description: t('products_meta') },
  { path: '/about', title: t('about_title'), description: t('about_meta') },
  { path: '/areas', title: t('areas_title'), description: t('areas_meta') },
  { path: '/imprint', title: t('imprint_title'), description: t('imprint_meta') },
  ...areas.map((area) => ({
    path: `/areas/${area.slug}`,
    // Mirror AreaDetail.jsx: `${name} | ${t('areas_title')}`.
    title: `${t(area.nameKey)} | ${t('areas_title')}`,
    description: t('area_detail_lead'),
  })),
];

// Escape a string for use inside a double-quoted HTML attribute / text node.
const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const template = readFileSync(join(DIST, 'index.html'), 'utf8');

if (!template.includes('<title>Gerti Foods</title>')) {
  throw new Error(
    'prerender: could not find the placeholder <title> in dist/index.html — ' +
      'did the index.html template change?'
  );
}

for (const route of routes) {
  const title = fullTitle(route.title);
  const canonical = `${BASE_URL}${route.path}`;

  // data-rh="true" marks these as helmet-managed so the client reconciles them.
  const head = [
    `<meta data-rh="true" name="description" content="${esc(route.description)}" />`,
    `<link data-rh="true" rel="canonical" href="${esc(canonical)}" />`,
    `<meta data-rh="true" property="og:title" content="${esc(title)}" />`,
    `<meta data-rh="true" property="og:description" content="${esc(route.description)}" />`,
    `<meta data-rh="true" property="og:url" content="${esc(canonical)}" />`,
    `<meta data-rh="true" property="og:locale" content="${OG_LOCALE}" />`,
  ].join('\n    ');

  const html = template
    .replace('<title>Gerti Foods</title>', `<title>${esc(title)}</title>`)
    .replace('</head>', `    ${head}\n  </head>`);

  // '/' is the template itself; every other route is written as <route>.html
  // (e.g. dist/about.html, dist/areas/kosovo.html) and served by nginx via
  // `try_files $uri $uri.html /index.html`. Using a flat .html file rather than
  // <route>/index.html avoids nginx's automatic 301 redirect to a trailing
  // slash, which would make each page's canonical point at a redirecting URL.
  const outPath =
    route.path === '/'
      ? join(DIST, 'index.html')
      : join(DIST, `${route.path.replace(/^\//, '')}.html`);

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html);
  console.log(`prerendered ${route.path} -> ${outPath.replace(DIST, 'dist')}`);
}

console.log(`\nprerender: wrote ${routes.length} pages with canonical tags.`);
