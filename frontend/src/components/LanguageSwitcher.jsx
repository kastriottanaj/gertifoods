import { useLanguage } from '../i18n/LanguageContext';

export default function LanguageSwitcher() {
  const { lang, setLang, SUPPORTED_LANGS, LANG_LABELS } = useLanguage();

  return (
    <div className="lang-switcher">
      {SUPPORTED_LANGS.map((code) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          className={`lang-btn ${lang === code ? 'lang-btn-active' : ''}`}
        >
          {LANG_LABELS[code]}
        </button>
      ))}
    </div>
  );
}
