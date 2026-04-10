import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import SEO from '../components/SEO';

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="home">
      <SEO title={t('home_title')} description={t('home_meta')} />

      <section className="hero">
        <div className="hero-content">
          <h1>{t('home_hero_title')}</h1>
          <p className="hero-subtitle">{t('home_hero_subtitle')}</p>
          <p className="hero-description">{t('home_hero_description')}</p>
          <div className="hero-actions">
            <Link to="/products" className="btn btn-lg" style={{ background: 'white', color: 'var(--primary)', fontWeight: 700 }}>
              {t('home_browse')}
            </Link>
            <Link to="/register" className="btn btn-outline-white btn-lg">
              {t('home_partner')}
            </Link>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon feature-icon-red">&#9733;</div>
            <h3>{t('home_quality_title')}</h3>
            <p>{t('home_quality_desc')}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon feature-icon-green">&#9734;</div>
            <h3>{t('home_b2b_title')}</h3>
            <p>{t('home_b2b_desc')}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon feature-icon-red">&#10003;</div>
            <h3>{t('home_delivery_title')}</h3>
            <p>{t('home_delivery_desc')}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon feature-icon-green">&#9830;</div>
            <h3>{t('home_bulk_title')}</h3>
            <p>{t('home_bulk_desc')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
