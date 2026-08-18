// Pre-build guard: fail loudly when a required client variable is missing.
//
// Vite inlines `import.meta.env.VITE_X` at build time. When the variable is not
// set it inlines the literal `undefined` and the build still succeeds, so the
// breakage only surfaces in the browser, in production, silently.
//
// That is not hypothetical — it shipped. Astro defaults `envPrefix` to
// 'PUBLIC_' where Vite defaults to 'VITE_', so after the migration every
// VITE_-prefixed variable resolved to undefined in client code however correct
// .env.production was. The reCAPTCHA loader constant-folded down to
// `getRecaptchaToken() => ''`, Django rejected every empty token, and all three
// lead forms — the site's entire conversion path — answered 400 for as long as
// that build was live.
//
// astro.config.mjs fixes the prefix. This file guards the other way in: the
// variable being absent from the environment in the first place, which
// .env.production being gitignored makes easy on a fresh build host. Same
// principle as astro/lib/products.js, which refuses to build an empty catalogue
// behind a sitemap full of product URLs.
//
// Note what is deliberately NOT checked: VITE_API_URL. Production is
// same-origin (nginx proxies /api to Gunicorn), so '/api' is a correct default
// and every consumer now uses it. Only local development, where Astro and
// Django are on different ports, needs to override it.
import { loadEnv } from 'vite';

// Must match `vite.envPrefix` in astro.config.mjs. loadEnv reads .env,
// .env.production and any matching process.env entry — exactly the set Vite
// itself will inline — so this check cannot disagree with the build it guards.
const ENV_PREFIXES = ['VITE_', 'PUBLIC_'];

const env = loadEnv('production', process.cwd(), ENV_PREFIXES);

// name -> why the build needs it, and what breaks without it.
const REQUIRED = {
  VITE_RECAPTCHA_SITE_KEY:
    'The backend enables reCAPTCHA whenever RECAPTCHA_SECRET_KEY is set\n' +
    '    (config/settings.py), and rejects any submission carrying an empty\n' +
    '    token. Without the matching site key here, every lead, sample and\n' +
    '    catalog form submission fails with HTTP 400.',
};

// Escape hatch for a deployment that genuinely runs without reCAPTCHA — the
// backend leaves it disabled when RECAPTCHA_SECRET_KEY is unset. Mirrors
// ALLOW_EMPTY_CATALOG=1 in astro/lib/products.js: off by default, because the
// safe-looking failure is the dangerous one.
if (process.env.ALLOW_NO_RECAPTCHA === '1') {
  delete REQUIRED.VITE_RECAPTCHA_SITE_KEY;
  console.warn(
    'build env: ALLOW_NO_RECAPTCHA=1 — building without reCAPTCHA.\n' +
      'build env: the forms will submit empty tokens, so the backend must have\n' +
      'build env: RECAPTCHA_SECRET_KEY unset or it will reject every submission.'
  );
}

const missing = Object.keys(REQUIRED).filter((name) => !env[name]?.trim());

if (missing.length) {
  const detail = missing.map((name) => `  ${name}\n    ${REQUIRED[name]}`).join('\n\n');
  console.error(
    `\nBuild stopped: ${missing.length} required variable(s) missing from ` +
      `frontend/.env.production\n\n${detail}\n\n` +
      'Create the file before building (see deploy/DEPLOY.md, "Build the frontend"):\n\n' +
      '  printf "%s\\n" \\\n' +
      '    "VITE_RECAPTCHA_SITE_KEY=<recaptcha-v3-site-key>" > .env.production\n\n' +
      'It is gitignored, so it does not survive a fresh clone and has to be\n' +
      'recreated on any new build host.\n'
  );
  process.exit(1);
}

console.log(`build env: ${Object.keys(REQUIRED).length} required variable(s) present`);
