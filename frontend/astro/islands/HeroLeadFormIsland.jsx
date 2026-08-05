import { LanguageProvider } from '../../src/i18n/LanguageContext';
import HeroLeadForm from '../../src/components/HeroLeadForm';

// Island wrapper for the hero lead form.
//
// HeroLeadForm is used unchanged — it is the site's primary conversion path, so
// its validation, error handling and POST to /api/leads/lead/ are ported by
// reuse rather than rewritten. The wrapper only supplies the LanguageProvider
// that App.jsx used to provide, pinned to the language this page was built in.
//
// Astro renders this to HTML at build time, so the form is visible and
// crawlable immediately; hydration only makes it interactive.
export default function HeroLeadFormIsland({ lang, source = 'home_hero' }) {
  return (
    <LanguageProvider initialLang={lang}>
      <HeroLeadForm source={source} />
    </LanguageProvider>
  );
}
