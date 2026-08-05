import { createContext, useContext, useState, useCallback } from 'react';
import translations from './translations';

// Exported so the Astro build can supply the same context from a much smaller
// message set — see astro/islands/IslandLanguage.jsx. Importing this module's
// LanguageProvider drags the whole three-language table into the bundle, which
// an island that only renders a form does not need.
export const LanguageContext = createContext(null);

const LANG_KEY = 'gertifoods_lang';
const SUPPORTED_LANGS = ['sq', 'en', 'de'];
const DEFAULT_LANG = 'sq';

function getInitialLang() {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
  const browserLang = navigator.language?.slice(0, 2);
  if (SUPPORTED_LANGS.includes(browserLang)) return browserLang;
  return DEFAULT_LANG;
}

const LANG_LABELS = {
  sq: 'Shqip',
  en: 'English',
  de: 'Deutsch',
};

const LANG_HTML_MAP = {
  sq: 'sq',
  en: 'en',
  de: 'de',
};

// `initialLang` lets a caller pin the language instead of deriving it from
// localStorage/navigator. The Astro build uses it: each page is rendered in one
// language at a known URL, so an island mounted on /de/... must render German
// regardless of what the visitor once clicked. Omitted by the SPA, which keeps
// the original getInitialLang() behaviour.
export function LanguageProvider({ children, initialLang }) {
  const [lang, setLangState] = useState(
    initialLang && SUPPORTED_LANGS.includes(initialLang) ? initialLang : getInitialLang
  );

  const setLang = useCallback((newLang) => {
    if (SUPPORTED_LANGS.includes(newLang)) {
      setLangState(newLang);
      localStorage.setItem(LANG_KEY, newLang);
      document.documentElement.lang = LANG_HTML_MAP[newLang];
    }
  }, []);

  const t = useCallback(
    (key) => translations[lang]?.[key] || translations[DEFAULT_LANG]?.[key] || key,
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, SUPPORTED_LANGS, LANG_LABELS }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
