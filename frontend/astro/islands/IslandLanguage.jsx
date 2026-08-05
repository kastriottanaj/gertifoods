import { useCallback, useMemo } from 'react';
import { LanguageContext } from '../../src/i18n/LanguageContext';

// Drop-in replacement for LanguageProvider inside islands.
//
// It provides the identical context shape, so every component below it keeps
// calling useLanguage().t() unchanged — but it takes its strings as a prop
// instead of importing the translation table, which is what kept all three
// languages out of the island bundles.
//
// setLang is a no-op by design: each page is built in one language at its own
// URL, and the switcher is a link that navigates. Nothing inside an island can
// or should change the language in place.
const SUPPORTED_LANGS = ['sq', 'en', 'de'];
const LANG_LABELS = { sq: 'Shqip', en: 'English', de: 'Deutsch' };

export default function IslandLanguage({ lang, messages, children }) {
  // Matches LanguageContext's contract: an unknown key renders as itself.
  const t = useCallback((key) => messages?.[key] ?? key, [messages]);

  const value = useMemo(
    () => ({ lang, t, setLang: () => {}, SUPPORTED_LANGS, LANG_LABELS }),
    [lang, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
