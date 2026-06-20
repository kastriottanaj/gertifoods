import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

const BASE_URL = 'https://gertifoods.com';

export default function SEO({ title, description }) {
  const { lang } = useLanguage();
  const location = useLocation();
  // Strip any trailing slash (except the root "/") so a page reachable at both
  // /products and /products/ resolves to one canonical, matching the sitemap
  // and the prerendered HTML (see frontend/prerender.js).
  const path = location.pathname.replace(/(.+)\/$/, '$1');
  const canonicalUrl = `${BASE_URL}${path}`;
  const fullTitle = title ? `${title} | Gerti Foods` : 'Gerti Foods';

  return (
    <Helmet>
      <html lang={lang} />
      <title>{fullTitle}</title>
      <meta name="description" content={description || ''} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || ''} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:locale" content={lang === 'sq' ? 'sq_AL' : lang === 'de' ? 'de_DE' : 'en_US'} />
    </Helmet>
  );
}
