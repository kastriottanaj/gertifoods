// Post-build guard: refuse to ship a bundle with a development value baked in.
//
// check-build-env.js catches a *missing* required variable. This catches the
// other half — a variable that was missing but had a fallback, so nothing
// failed and the wrong value was inlined into every page instead.
//
// Both shapes shipped to production together:
//
//   Navbar.astro   `VITE_API_URL || 'http://localhost:8000/api'`
//                  -> 81 pages told the browser to call localhost. The signed-in
//                     navbar never appeared and logout never reached the server,
//                     so the refresh cookie outlived every "log out".
//
//   CatalogRequestForm.jsx  `${VITE_API_URL}/media/catalog/...`
//                  -> window.open('undefined/media/catalog/...')
//
// Neither failed the build, and neither is visible in a diff — they only exist
// in dist/. So they are checked where they appear: in the built output.
//
// The patterns are deliberately narrow. Broad ones false-positive on vendored
// code: axios ships `window.location.href || 'http://localhost'`, which is
// legitimate and must not fail a build — hence the required :port below.
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

const FORBIDDEN = [
  {
    // A dev host with an explicit port. Bare "localhost" is not enough: see
    // the axios note above.
    pattern: /localhost:\d+/g,
    why: 'a development host was inlined — check the VITE_API_URL fallbacks',
  },
  {
    // `${undefined}/path` — a URL assembled from an unset variable.
    pattern: /undefined\/[\w./-]+/g,
    why: 'a URL was built from an undefined variable — give it a real default',
  },
];

// Checking that a variable exists in the environment is not the same as
// checking that it reached the browser, and the difference is exactly what the
// envPrefix bug exploited: .env.production was present and correct the whole
// time, and the value still never landed in the bundle. So assert the effect
// rather than the input — src/lib/recaptcha.js only emits its loader when the
// site key is truthy at build time, so 'grecaptcha' appearing in dist/ is
// first-hand proof the key was inlined.
const REQUIRED_MARKER = {
  needle: 'grecaptcha',
  why:
    'the reCAPTCHA loader is missing from the bundle, which means\n' +
    '    VITE_RECAPTCHA_SITE_KEY was not inlined and getRecaptchaToken() was\n' +
    '    constant-folded to return an empty string. Django rejects empty\n' +
    '    tokens, so every lead form would answer HTTP 400.',
};

const hits = [];
let markerFound = false;

for await (const file of glob('**/*.{html,js,mjs,css}', { cwd: DIST })) {
  const text = await readFile(join(DIST, file), 'utf8');
  for (const { pattern, why } of FORBIDDEN) {
    for (const match of text.matchAll(pattern)) {
      hits.push({ file, value: match[0], why });
    }
  }
  if (text.includes(REQUIRED_MARKER.needle)) markerFound = true;
}

// A page with data-open-modal buttons needs the script that turns a click into
// the 'gf:open-modal' event ModalHost listens for. Five product pages shipped
// the buttons and the island without it, so their main call to action did
// nothing for weeks and no build noticed. The bridge is usually inlined; when
// it is not, it sits in one of the page's module scripts or a chunk they import.
const BRIDGE = 'gf:open-modal';
const deadButtons = [];

async function distText(src) {
  try {
    return await readFile(join(DIST, src.replace(/^\//, '')), 'utf8');
  } catch {
    return '';
  }
}

for await (const file of glob('**/*.html', { cwd: DIST })) {
  const html = await readFile(join(DIST, file), 'utf8');
  if (!html.includes('data-open-modal=') || html.includes(BRIDGE)) continue;

  let bridged = false;
  for (const [, src] of html.matchAll(/<script[^>]*\ssrc="(\/_astro\/[^"]+\.js)"/g)) {
    const code = await distText(src);
    const imports = [...code.matchAll(/["'](\.\/[^"']+\.js)["']/g)].map(([, rel]) =>
      join(dirname(src), rel)
    );
    const chunks = await Promise.all(imports.map(distText));
    if ([code, ...chunks].some((text) => text.includes(BRIDGE))) {
      bridged = true;
      break;
    }
  }
  if (!bridged) deadButtons.push(file);
}

if (deadButtons.length) {
  console.error(
    `\nBuild stopped: ${deadButtons.length} page(s) have data-open-modal buttons that open nothing\n\n` +
      deadButtons.map((file) => `  ${file}`).join('\n') +
      `\n\n  No script on these pages dispatches '${BRIDGE}', so ModalHost never\n` +
      '  hears the click. Add the bridge script the other pages use (see\n' +
      '  views/ProductDetail.astro) to the view that renders the buttons.\n'
  );
  process.exit(1);
}

// Links written inside copy ([text](/path), astro/lib/copyLinks.js) fail
// silently in two ways, both visible only in dist/: a view that prints a
// linked key with plain {t(...)} serves the raw markup to readers, and a
// mistyped path makes a link that 404s. A third rule keeps each language
// edition linking within itself, the mistake the 2026-11-24 link audit kept
// suggesting. llms-full.txt is checked for markup too: it strips links line by
// line, so any left there bypassed that.
const LINK_MARKUP = /\[[^[\]\n]+\]\(\/(?!\/)[^()\s]*\)/;
const FILE_LANG = /^(en|de)(?:\/|\.html$)/;
const HREF_LANG = /^\/(en|de)(?=\/|$)/;
const linkProblems = [];

for await (const file of glob('**/*.{html,txt}', { cwd: DIST })) {
  // Executable scripts and styles are code, not copy (minified JS can read
  // like a[b](/x/)). JSON-LD and island props stay in: they carry copy.
  const text = (await readFile(join(DIST, file), 'utf8'))
    .replace(/<script\b(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/g, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, '');
  const stray = text.match(LINK_MARKUP);
  if (stray) linkProblems.push(`${file}: raw link markup ${stray[0]} (render the key through LinkedText)`);
  if (!file.endsWith('.html')) continue;

  const pageLang = file.match(FILE_LANG)?.[1] ?? 'sq';
  for (const [tag] of text.matchAll(/<a\b[^>]*\bclass="text-link"[^>]*>/g)) {
    const href = tag.match(/\bhref="([^"]*)"/)?.[1] ?? '';
    const path = href.split(/[?#]/)[0];
    const page = path === '/' ? 'index.html' : `${path.slice(1)}.html`;
    if (!existsSync(join(DIST, page))) linkProblems.push(`${file}: links to ${href}, which is not a page in dist/`);
    const hrefLang = path.match(HREF_LANG)?.[1] ?? 'sq';
    if (hrefLang !== pageLang) linkProblems.push(`${file}: links to ${href}, outside its own language (${pageLang})`);
  }
}

if (linkProblems.length) {
  console.error(
    `\nBuild stopped: ${linkProblems.length} problem(s) with links written in copy\n\n` +
      linkProblems.map((problem) => `  ${problem}`).join('\n') +
      '\n\n  The format and its rules are in frontend/astro/lib/copyLinks.js.\n'
  );
  process.exit(1);
}

// Skipped under the same escape hatch check-build-env.js honours, so a
// deliberately reCAPTCHA-free build is not blocked by its own absence.
if (!markerFound && process.env.ALLOW_NO_RECAPTCHA !== '1') {
  console.error(
    `\nBuild stopped: expected marker "${REQUIRED_MARKER.needle}" not found in dist/\n\n` +
      `  ${REQUIRED_MARKER.why}\n\n` +
      'Check that VITE_RECAPTCHA_SITE_KEY is set and that vite.envPrefix in\n' +
      'astro.config.mjs still includes the prefix it uses.\n'
  );
  process.exit(1);
}

if (hits.length) {
  // One line per distinct value, with the file count, rather than 81 identical
  // lines for a value the layout put on every page.
  const grouped = new Map();
  for (const hit of hits) {
    const entry = grouped.get(hit.value) ?? { why: hit.why, files: new Set() };
    entry.files.add(hit.file);
    grouped.set(hit.value, entry);
  }

  const detail = [...grouped]
    .map(([value, { why, files }]) => {
      const [first] = files;
      const rest = files.size > 1 ? ` (+${files.size - 1} more)` : '';
      return `  ${value}\n    in ${first}${rest}\n    ${why}`;
    })
    .join('\n\n');

  console.error(
    `\nBuild stopped: ${grouped.size} development value(s) found in dist/\n\n` +
      `${detail}\n\n` +
      'These would have been served to real visitors. Fix the source, or set\n' +
      'the variable the fallback stands in for, and build again.\n'
  );
  process.exit(1);
}

console.log(
  'build output: no development values inlined, every modal button is wired, every link in copy resolves'
);
