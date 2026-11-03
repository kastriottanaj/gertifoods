// Build-time message subsets for React islands.
//
// LanguageProvider imports the full translation table, and Vite cannot
// tree-shake object properties, so any island using it shipped all three
// languages — 111 KB minified, of which an island renders maybe fifty strings.
//
// Astro knows each page's language at build time, so the island can simply be
// handed the strings it needs as props. This module builds that subset.
//
// Selection is by PREFIX, not by the literal keys a grep would find. That is
// deliberate: SampleRequestForm builds a key at runtime
// (`sample_form_business_${type}`), so an exact-key list would silently drop
// the business-type options. Whole namespaces are safe against that.
//
// This runs in Astro frontmatter only — at build time, on the server — so
// importing the full table here costs the browser nothing.
import translations from '../../src/i18n/translations.js';
import { DEFAULT_LANG } from './i18n.js';

// Everything the public islands render: the three lead forms and the modal
// chrome.
const PUBLIC_PREFIXES = ['hero_form_', 'sample_form_', 'catalog_form_', 'modal_'];

// The exit-intent popup renders only the sample form inside a modal. This
// subset is ~1.2 KB and ships in every page's HTML, because the popup can fire
// on any page — cheap enough that it is worth it to keep the 107 KB translation
// table out of the client build entirely.
const EXIT_PREFIXES = ['sample_form_', 'modal_'];

const SCOPES = {
  public: PUBLIC_PREFIXES,
  exit: EXIT_PREFIXES,
};

export function islandMessages(lang, scope = 'public') {
  const prefixes = SCOPES[scope] ?? PUBLIC_PREFIXES;
  const table = translations[lang] ?? translations[DEFAULT_LANG];
  const fallback = translations[DEFAULT_LANG];

  const out = {};
  for (const key of Object.keys(fallback)) {
    if (prefixes.some((p) => key.startsWith(p))) {
      // Same fallback chain as LanguageContext: requested language, then
      // Albanian.
      out[key] = table[key] ?? fallback[key];
    }
  }
  return out;
}
