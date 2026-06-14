import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import SEO from '../components/SEO';
import { areas } from '../data/areas';

export default function Areas() {
  const { t } = useLanguage();

  return (
    <div className="areas-page">
      <SEO title={t('areas_title')} description={t('areas_meta')} />
      <h1>{t('areas_title')}</h1>
      <p className="areas-intro">{t('areas_intro')}</p>

      <div className="areas-grid">
        {areas.map((area) => (
          <Link key={area.slug} to={`/areas/${area.slug}`} className="area-card">
            <h2>{t(area.nameKey)}</h2>
            <span className="area-card-cta">{t('areas_card_cta')} &rarr;</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
