import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import SEO from '../components/SEO';

export default function About() {
  const { t } = useLanguage();

  return (
    <div className="about-page">
      <SEO title={t('about_title')} description={t('about_meta')} />
      <h1>{t('about_title')}</h1>
      <p className="about-intro">{t('about_intro')}</p>

      <div className="about-stats">
        <div className="about-stat">
          <span className="about-stat-number">2024</span>
          <span className="about-stat-label">{t('about_stat_founded')}</span>
        </div>
        <div className="about-stat">
          <span className="about-stat-number">600+</span>
          <span className="about-stat-label">{t('about_stat_years')}</span>
        </div>
        <div className="about-stat">
          <span className="about-stat-number">ISO 22000</span>
          <span className="about-stat-label">{t('about_stat_certs')}</span>
        </div>
        <div className="about-stat">
          <span className="about-stat-number">6,000</span>
          <span className="about-stat-label">{t('about_stat_capacity')}</span>
        </div>
      </div>

      <section className="about-section">
        <h2>{t('about_story_heading')}</h2>
        <p>{t('about_story_body')}</p>
      </section>

      <section className="about-section">
        <h2>{t('about_mission_heading')}</h2>
        <p>{t('about_mission_body')}</p>
      </section>

      <section className="about-section">
        <h2>{t('about_values_heading')}</h2>
        <div className="about-values">
          <div className="about-value">
            <h3>{t('about_value_1_title')}</h3>
            <p>{t('about_value_1_body')}</p>
          </div>
          <div className="about-value">
            <h3>{t('about_value_2_title')}</h3>
            <p>{t('about_value_2_body')}</p>
          </div>
          <div className="about-value">
            <h3>{t('about_value_3_title')}</h3>
            <p>{t('about_value_3_body')}</p>
          </div>
        </div>
      </section>

      <div className="about-cta">
        <h2>{t('about_cta_title')}</h2>
        <Link to="/products" className="btn btn-primary">{t('about_cta_button')}</Link>
      </div>
    </div>
  );
}
