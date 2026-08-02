import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import SEO from '../components/SEO';
import { areas } from '../data/areas';
import heroImage from '../assets/areas-we-serve.webp';

const CALENDLY_URL = 'https://calendly.com/arlinda-gertifoods/30min';
const FLAGS = { kosovo: '🇽🇰', albania: '🇦🇱', hungary: '🇭🇺', croatia: '🇭🇷', slovakia: '🇸🇰', germany: '🇩🇪' };

export default function Areas() {
  const { t } = useLanguage();

  return (
    <div className="areas-page areas-showcase">
      <SEO title={t('areas_title')} description={t('areas_meta')} />
      <section className="areas-hero">
        <img src={heroImage} alt={t('areas_hero_alt')} className="areas-hero-image" fetchPriority="high" />
        <div className="areas-hero-shade" />
        <div className="areas-hero-content">
          <h1>{t('areas_hero_line_1')}<br />{t('areas_hero_line_2')} <strong>{t('areas_hero_region')}</strong></h1>
          <p>{t('areas_intro')}</p>
          <div className="areas-benefits">
            <article><i>▱</i><div><b>{t('areas_reliable')}</b><span>{t('areas_reliable_body')}</span></div></article>
            <article><i>◎</i><div><b>{t('areas_quality')}</b><span>{t('areas_quality_body')}</span></div></article>
            <article><i>♧</i><div><b>{t('areas_partner')}</b><span>{t('areas_partner_body')}</span></div></article>
          </div>
        </div>
      </section>

      <section className="areas-listing">
        <div className="areas-heading"><h2>{t('areas_where')}</h2><p>{t('areas_select_country')}</p></div>
        <div className="areas-grid">
          {areas.map((area, index) => (
            <Link key={area.slug} to={`/areas/${area.slug}`} className={`area-card area-card-${index + 1}`}>
              <div className="area-card-image" style={{ backgroundImage: `url(${heroImage})` }}>
                <span>{FLAGS[area.slug]}</span><h3>{t(area.nameKey)}</h3>
              </div>
              <div className="area-card-body"><p>{t(`areas_${area.slug}_body`)}</p><span>{t('areas_card_cta')} →</span></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="areas-growth">
        <i>♧</i><div><h2>{t('areas_growth_title')}</h2><p>{t('areas_growth_body')}</p></div>
        <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">{t('footer_book_meeting')}</a>
        <a href="tel:+38349111150" className="areas-growth-phone">☎ &nbsp; +383 49 111 150</a>
      </section>

      <div className="areas-mobile-contact"><a href="tel:+38349111150">☎ &nbsp; {t('products_call_now')}</a><a href="https://wa.me/38349111150" target="_blank" rel="noopener noreferrer">◉ &nbsp; WhatsApp</a></div>
    </div>
  );
}
