import { createContext, useContext, useState, useCallback } from 'react';
import translations from './translations';

const LanguageContext = createContext(null);

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

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang);

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
