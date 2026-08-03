import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import SEO from '../components/SEO';
import { getArea } from '../data/areas';
import kosovoHero from '../assets/gerti-foods-kosovo.webp';
import bakeryImage from '../assets/bakery-interior.webp';
import hotelImage from '../assets/gerti-foods-about-us.webp';
import restaurantImage from '../assets/products/Pie.webp';
import supermarketImage from '../assets/products/Family-pack.webp';

const CALENDLY_URL = 'https://calendly.com/arlinda-gertifoods/30min';

function KosovoDetail({ t, name }) {
  const segments = [
    ['kosovo_segment_bakeries', 'kosovo_segment_bakeries_body', bakeryImage, '♨'],
    ['kosovo_segment_hotels', 'kosovo_segment_hotels_body', hotelImage, '⌂'],
    ['kosovo_segment_restaurants', 'kosovo_segment_restaurants_body', restaurantImage, '♧'],
    ['kosovo_segment_supermarkets', 'kosovo_segment_supermarkets_body', supermarketImage, '▰'],
    ['kosovo_segment_catering', 'kosovo_segment_catering_body', restaurantImage, '⌂'],
  ];

  return (
    <div className="kosovo-page">
      <SEO title={`${name} | ${t('areas_title')}`} description={t('kosovo_hero_body')} />
      <section className="kosovo-hero">
        <img src={kosovoHero} alt={t('kosovo_hero_alt')} className="kosovo-hero-image" fetchPriority="high" />
        <div className="kosovo-hero-shade" />
        <div className="kosovo-hero-content">
          <nav className="kosovo-breadcrumb"><Link to="/areas">{t('areas_title')}</Link> / <span>{name}</span></nav>
          <h1>{t('kosovo_hero_line_1')}<br />{t('kosovo_hero_line_2')} <strong>{t('kosovo_hero_region')}</strong></h1>
          <p>{t('kosovo_hero_body')}</p>
          <div className="kosovo-benefits">
            <article><i>▱</i><div><b>{t('kosovo_delivery')}</b><span>{t('kosovo_delivery_body')}</span></div></article>
            <article><i>◎</i><div><b>{t('kosovo_quality')}</b><span>{t('kosovo_quality_body')}</span></div></article>
            <article><i>♧</i><div><b>{t('kosovo_support')}</b><span>{t('kosovo_support_body')}</span></div></article>
          </div>
          <div className="kosovo-hero-actions"><Link to="/products">{t('areas_cta_products')}</Link><Link to="/areas">← &nbsp; {t('area_back')}</Link></div>
        </div>
      </section>

      <section className="kosovo-segments">
        <h2>{t('kosovo_serve_title')}</h2>
        <div className="kosovo-segment-grid">
          {segments.map(([title, body, image, icon]) => <article key={title}><img src={image} alt="" loading="lazy" /><i>{icon}</i><div><h3>{t(title)}</h3><p>{t(body)}</p></div></article>)}
        </div>
      </section>

      <section className="kosovo-growth"><i>⌕</i><div><h2>{t('kosovo_growth_title')}</h2><p>{t('kosovo_growth_body')}</p></div><a href="tel:+38349111150">☎ &nbsp; +383 49 111 150</a><a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">{t('footer_book_meeting')}</a></section>
      <div className="kosovo-mobile-contact"><a href="tel:+38349111150">☎ &nbsp; {t('products_call_now')}</a><a href="https://wa.me/38349111150" target="_blank" rel="noopener noreferrer">◉ &nbsp; WhatsApp</a></div>
    </div>
  );
}

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

  if (slug === 'kosovo') return <KosovoDetail t={t} name={name} />;

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
