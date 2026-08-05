import IslandLanguage from './IslandLanguage.jsx';
import HeroLeadForm from '../../src/components/HeroLeadForm';

// Island wrapper for the hero lead form.
//
// HeroLeadForm is used unchanged — it is the site's primary conversion path, so
// its validation, error handling and POST to /api/leads/lead/ are ported by
// reuse rather than rewritten. The wrapper only supplies the language context
// App.jsx used to provide, with the strings passed in from the build.
//
// Astro renders this to HTML at build time, so the form is visible and
// crawlable immediately; hydration only makes it interactive.
export default function HeroLeadFormIsland({ lang, messages, source = 'home_hero' }) {
  return (
    <IslandLanguage lang={lang} messages={messages}>
      <HeroLeadForm source={source} />
    </IslandLanguage>
  );
}
