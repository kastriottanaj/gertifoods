// Build-time translation lookup for Astro pages.
//
// Reads the same src/i18n/translations.js the React app uses, so there is one
// source of copy for both stacks during the migration. This resolves at build
// time, which is the whole point: the translated text ends up in the HTML
// instead of being assembled in the browser after the JS bundle loads.
//
// React components rendered as islands keep using useLanguage() from
// src/i18n/LanguageContext.jsx and are unaffected by this.
import translations from '../../src/i18n/translations.js';
import { THANK_YOU_PATHS } from '../../src/lib/conversion.js';

export const DEFAULT_LANG = 'sq';
export const SUPPORTED_LANGS = ['sq', 'en', 'de'];

// Languages that carry a URL prefix. Albanian is the default locale and stays
// unprefixed, so every URL the site serves today keeps its exact address.
export const PREFIXED_LANGS = SUPPORTED_LANGS.filter((l) => l !== DEFAULT_LANG);

/**
 * getStaticPaths() body for every page under pages/[lang]/ — builds the English
 * and German variants. The Albanian variant is the sibling route at the root.
 */
export function localeStaticPaths() {
  return PREFIXED_LANGS.map((lang) => ({ params: { lang } }));
}

// og:locale values, mirroring SEO.jsx.
export const OG_LOCALES = {
  sq: 'sq_AL',
  en: 'en_US',
  de: 'de_DE',
};

// Switcher labels, copied from LanguageContext.jsx so both stacks agree.
export const LANG_LABELS = {
  sq: 'Shqip',
  en: 'English',
  de: 'Deutsch',
};

/**
 * Returns a `t(key)` function for the given language.
 *
 * The fallback chain mirrors LanguageContext.jsx exactly — requested language,
 * then Albanian, then the key itself — so a key missing from a translation
 * renders identically in both stacks.
 */
export function useTranslations(lang = DEFAULT_LANG) {
  return function t(key) {
    return translations[lang]?.[key] ?? translations[DEFAULT_LANG]?.[key] ?? key;
  };
}

/**
 * Turns a build-time pathname into the URL the site actually serves.
 *
 * With build.format: 'file' the pathname carries the on-disk extension
 * (/imprint.html), but nginx serves it at /imprint via `try_files $uri
 * $uri.html`. In `astro dev` the pathname is already extensionless, so this is
 * a no-op there and both modes agree.
 */
export function normalizePath(pathname) {
  return (
    pathname
      .replace(/index\.html$/, '') // /index.html -> /
      .replace(/\.html$/, '') // /imprint.html -> /imprint
      .replace(/(.+)\/$/, '$1') || '/' // drop trailing slash except on the root
  );
}

/**
 * Maps a language-neutral path onto its localised URL.
 *
 * Albanian is the default locale and stays unprefixed, so every URL that exists
 * today keeps its exact address and no current ranking is disturbed. English
 * and German get a prefix:
 *
 *   localePath('sq', '/about') -> '/about'
 *   localePath('de', '/about') -> '/de/about'
 *   localePath('de', '/')      -> '/de'
 */
export function localePath(lang, path = '/') {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (lang === DEFAULT_LANG) return clean;
  return clean === '/' ? `/${lang}` : `/${lang}${clean}`;
}

/**
 * Inverse of localePath: removes any locale prefix, so the language switcher
 * can rebuild the current page's address in another language rather than
 * dumping the visitor back on the home page.
 */
export function stripLocale(pathname) {
  const match = pathname.match(/^\/(en|de)(?=\/|$)/);
  return match ? pathname.slice(match[0].length) || '/' : pathname;
}

// Routes whose slug is translated per language rather than only prefixed.
//
// Every other page on the site shares one slug across the three editions
// (/about, /en/about, /de/about), which is why localePath() alone was enough
// until now. The thank-you page does not: its whole point is a distinct,
// readable URL per language, so /en/thank-you's German sibling is /de/danke —
// a path localePath() could never derive, since the slug itself changes.
//
// Each entry is a complete lang -> full path map. Add future translated routes
// here and every caller below picks them up.
const TRANSLATED_ROUTES = [THANK_YOU_PATHS];

export { THANK_YOU_PATHS };

/**
 * The address of the *current* page in another language.
 *
 * Takes the full pathname (prefix included) rather than a stripped base path,
 * because a translated slug can only be recognised in its complete form.
 *
 *   alternatePath('de', '/en/about')      -> '/de/about'   (prefix swap)
 *   alternatePath('de', '/en/thank-you')  -> '/de/danke'   (translated slug)
 *
 * For every non-translated route this is exactly what
 * `localePath(lang, stripLocale(path))` already produced, so existing pages
 * are unaffected.
 */
export function alternatePath(lang, pathname) {
  for (const route of TRANSLATED_ROUTES) {
    if (Object.values(route).includes(pathname)) return route[lang];
  }
  return localePath(lang, stripLocale(pathname));
}
