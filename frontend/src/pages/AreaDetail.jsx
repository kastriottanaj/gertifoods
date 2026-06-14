import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import SEO from '../components/SEO';
import { getArea } from '../data/areas';

export default function AreaDetail() {
  const { slug } = useParams();
  const { t } = useLanguage();
  const area = getArea(slug);

  if (!area) {
    return (
      <div className="area-detail-page">
        <p>{t('area_not_found')}</p>
        <Link to="/areas" className="area-back">&larr; {t('area_back')}</Link>
      </div>
    );
  }

  const name = t(area.nameKey);

  return (
    <div className="area-detail-page">
      <SEO title={`${name} | ${t('areas_title')}`} description={t('area_detail_lead')} />
      <nav className="area-breadcrumb">
        <Link to="/areas">{t('areas_title')}</Link> / <span>{name}</span>
      </nav>
      <h1>{name}</h1>
      <p className="area-detail-lead">{t('area_detail_lead')}</p>
      <p className="area-detail-soon">{t('area_detail_soon')}</p>

      <div className="area-detail-actions">
        <Link to="/products" className="btn btn-primary">{t('areas_cta_products')}</Link>
        <Link to="/areas" className="area-back">&larr; {t('area_back')}</Link>
      </div>
    </div>
  );
}
