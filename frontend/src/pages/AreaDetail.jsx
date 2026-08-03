import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import SEO from '../components/SEO';
import { getArea } from '../data/areas';
import kosovoHero from '../assets/gerti-foods-kosovo.webp';
import albaniaHero from '../assets/gerti-foods-albania.webp';
import hungaryHero from '../assets/gerti-foods-hungary.webp';
import croatiaHero from '../assets/gerti-foods-croatia.webp';
import slovakiaHero from '../assets/gerti-foods-slovakia.webp';
import germanyHero from '../assets/gerti-foods-germany.webp';
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

function AlbaniaDetail({ t, name }) {
  const segments = [
    ['albania_segment_bakeries', 'albania_segment_bakeries_body', bakeryImage, '♨'],
    ['albania_segment_hotels', 'albania_segment_hotels_body', hotelImage, '⌂'],
    ['albania_segment_restaurants', 'albania_segment_restaurants_body', restaurantImage, '♧'],
    ['albania_segment_supermarkets', 'albania_segment_supermarkets_body', supermarketImage, '▰'],
    ['albania_segment_catering', 'albania_segment_catering_body', restaurantImage, '⌂'],
  ];

  return (
    <div className="kosovo-page albania-page">
      <SEO title={`${name} | ${t('areas_title')}`} description={t('albania_hero_body')} />
      <section className="kosovo-hero">
        <img src={albaniaHero} alt={t('albania_hero_alt')} className="kosovo-hero-image" fetchPriority="high" />
        <div className="kosovo-hero-shade" />
        <div className="kosovo-hero-content">
          <nav className="kosovo-breadcrumb"><Link to="/areas">{t('areas_title')}</Link> / <span>{name}</span></nav>
          <h1>{t('albania_hero_line_1')}<br />{t('albania_hero_line_2')} <strong>{t('albania_hero_region')}</strong></h1>
          <p>{t('albania_hero_body')}</p>
          <div className="kosovo-benefits albania-benefits">
            <article><i>▱</i><div><b>{t('albania_delivery')}</b><span>{t('albania_delivery_body')}</span></div></article>
            <article><i>◎</i><div><b>{t('albania_quality')}</b><span>{t('albania_quality_body')}</span></div></article>
            <article><i>♧</i><div><b>{t('albania_support')}</b><span>{t('albania_support_body')}</span></div></article>
            <article><i>◷</i><div><b>{t('albania_time')}</b><span>{t('albania_time_body')}</span></div></article>
          </div>
          <div className="kosovo-hero-actions"><Link to="/products">{t('areas_cta_products')}</Link><Link to="/areas">← &nbsp; {t('area_back')}</Link></div>
        </div>
      </section>

      <section className="kosovo-segments">
        <h2>{t('albania_serve_title')}</h2>
        <div className="kosovo-segment-grid">
          {segments.map(([title, body, image, icon]) => <article key={title}><img src={image} alt="" loading="lazy" /><i>{icon}</i><div><h3>{t(title)}</h3><p>{t(body)}</p><Link to="/products" className="albania-learn">{t('about_learn_more')} →</Link></div></article>)}
        </div>
      </section>

      <section className="kosovo-growth"><i>⌕</i><div><h2>{t('albania_growth_title')}</h2><p>{t('albania_growth_body')}</p></div><a href="tel:+38349111150">☎ &nbsp; +383 49 111 150</a><a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">{t('footer_book_meeting')}</a></section>
      <div className="kosovo-mobile-contact"><a href="tel:+38349111150">☎ &nbsp; {t('products_call_now')}</a><a href="https://wa.me/38349111150" target="_blank" rel="noopener noreferrer">◉ &nbsp; WhatsApp</a></div>
    </div>
  );
}

function HungaryDetail({ t, name }) {
  const segments = [
    ['hungary_segment_bakeries', 'hungary_segment_bakeries_body', bakeryImage, '♨'],
    ['hungary_segment_hotels', 'hungary_segment_hotels_body', hotelImage, '⌂'],
    ['hungary_segment_restaurants', 'hungary_segment_restaurants_body', restaurantImage, '♧'],
    ['hungary_segment_supermarkets', 'hungary_segment_supermarkets_body', supermarketImage, '▰'],
    ['hungary_segment_catering', 'hungary_segment_catering_body', restaurantImage, '⌂'],
  ];
  return (
    <div className="kosovo-page hungary-page">
      <SEO title={`${name} | ${t('areas_title')}`} description={t('hungary_hero_body')} />
      <section className="kosovo-hero"><img src={hungaryHero} alt={t('hungary_hero_alt')} className="kosovo-hero-image" fetchPriority="high" /><div className="kosovo-hero-shade" /><div className="kosovo-hero-content">
        <nav className="kosovo-breadcrumb"><Link to="/areas">{t('areas_title')}</Link> / <span>{name}</span></nav>
        <h1>{t('hungary_hero_line_1')}<br />{t('hungary_hero_line_2')} <strong>{t('hungary_hero_region')}</strong></h1><p>{t('hungary_hero_body')}</p>
        <div className="kosovo-benefits albania-benefits"><article><i>▱</i><div><b>{t('hungary_delivery')}</b><span>{t('hungary_delivery_body')}</span></div></article><article><i>◎</i><div><b>{t('hungary_quality')}</b><span>{t('hungary_quality_body')}</span></div></article><article><i>♧</i><div><b>{t('hungary_support')}</b><span>{t('hungary_support_body')}</span></div></article><article><i>◷</i><div><b>{t('hungary_time')}</b><span>{t('hungary_time_body')}</span></div></article></div>
        <div className="kosovo-hero-actions"><Link to="/products">{t('areas_cta_products')}</Link><Link to="/areas">← &nbsp; {t('area_back')}</Link></div>
      </div></section>
      <section className="kosovo-segments"><h2>{t('hungary_serve_title')}</h2><div className="kosovo-segment-grid">{segments.map(([title, body, image, icon]) => <article key={title}><img src={image} alt="" loading="lazy" /><i>{icon}</i><div><h3>{t(title)}</h3><p>{t(body)}</p><Link to="/products" className="albania-learn">{t('about_learn_more')} →</Link></div></article>)}</div></section>
      <section className="kosovo-growth"><i>⌕</i><div><h2>{t('hungary_growth_title')}</h2><p>{t('hungary_growth_body')}</p></div><a href="tel:+38349111150">☎ &nbsp; +383 49 111 150</a><a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">{t('footer_book_meeting')}</a></section>
      <div className="kosovo-mobile-contact"><a href="tel:+38349111150">☎ &nbsp; {t('products_call_now')}</a><a href="https://wa.me/38349111150" target="_blank" rel="noopener noreferrer">◉ &nbsp; WhatsApp</a></div>
    </div>
  );
}

function CroatiaDetail({ t, name }) {
  const segments = [
    ['croatia_segment_bakeries', 'croatia_segment_bakeries_body', bakeryImage, '♨'], ['croatia_segment_hotels', 'croatia_segment_hotels_body', hotelImage, '⌂'], ['croatia_segment_restaurants', 'croatia_segment_restaurants_body', restaurantImage, '♧'], ['croatia_segment_supermarkets', 'croatia_segment_supermarkets_body', supermarketImage, '▰'], ['croatia_segment_catering', 'croatia_segment_catering_body', restaurantImage, '⌂'],
  ];
  return <div className="kosovo-page hungary-page croatia-page"><SEO title={`${name} | ${t('areas_title')}`} description={t('croatia_hero_body')} />
    <section className="kosovo-hero"><img src={croatiaHero} alt={t('croatia_hero_alt')} className="kosovo-hero-image" fetchPriority="high" /><div className="kosovo-hero-shade" /><div className="kosovo-hero-content"><nav className="kosovo-breadcrumb"><Link to="/areas">{t('areas_title')}</Link> / <span>{name}</span></nav><h1>{t('croatia_hero_line_1')}<br />{t('croatia_hero_line_2')} <strong>{t('croatia_hero_region')}</strong></h1><p>{t('croatia_hero_body')}</p><div className="kosovo-benefits albania-benefits"><article><i>▱</i><div><b>{t('croatia_delivery')}</b><span>{t('croatia_delivery_body')}</span></div></article><article><i>◎</i><div><b>{t('croatia_quality')}</b><span>{t('croatia_quality_body')}</span></div></article><article><i>♧</i><div><b>{t('croatia_support')}</b><span>{t('croatia_support_body')}</span></div></article><article><i>◷</i><div><b>{t('croatia_time')}</b><span>{t('croatia_time_body')}</span></div></article></div><div className="kosovo-hero-actions"><Link to="/products">{t('areas_cta_products')}</Link><Link to="/areas">← &nbsp; {t('area_back')}</Link></div></div></section>
    <section className="kosovo-segments"><h2>{t('croatia_serve_title')}</h2><div className="kosovo-segment-grid">{segments.map(([title, body, image, icon]) => <article key={title}><img src={image} alt="" loading="lazy" /><i>{icon}</i><div><h3>{t(title)}</h3><p>{t(body)}</p><Link to="/products" className="albania-learn">{t('about_learn_more')} →</Link></div></article>)}</div></section>
    <section className="kosovo-growth"><i>⌕</i><div><h2>{t('croatia_growth_title')}</h2><p>{t('croatia_growth_body')}</p></div><a href="tel:+38349111150">☎ &nbsp; +383 49 111 150</a><a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">{t('footer_book_meeting')}</a></section><div className="kosovo-mobile-contact"><a href="tel:+38349111150">☎ &nbsp; {t('products_call_now')}</a><a href="https://wa.me/38349111150" target="_blank" rel="noopener noreferrer">◉ &nbsp; WhatsApp</a></div>
  </div>;
}

function SlovakiaDetail({ t, name }) {
  const segments = [['slovakia_segment_bakeries','slovakia_segment_bakeries_body',bakeryImage,'♨'],['slovakia_segment_hotels','slovakia_segment_hotels_body',hotelImage,'⌂'],['slovakia_segment_restaurants','slovakia_segment_restaurants_body',restaurantImage,'♧'],['slovakia_segment_supermarkets','slovakia_segment_supermarkets_body',supermarketImage,'▰'],['slovakia_segment_catering','slovakia_segment_catering_body',restaurantImage,'⌂']];
  return <div className="kosovo-page hungary-page slovakia-page"><SEO title={`${name} | ${t('areas_title')}`} description={t('slovakia_hero_body')} /><section className="kosovo-hero"><img src={slovakiaHero} alt={t('slovakia_hero_alt')} className="kosovo-hero-image" fetchPriority="high" /><div className="kosovo-hero-shade" /><div className="kosovo-hero-content"><nav className="kosovo-breadcrumb"><Link to="/areas">{t('areas_title')}</Link> / <span>{name}</span></nav><h1>{t('slovakia_hero_line_1')}<br />{t('slovakia_hero_line_2')} <strong>{t('slovakia_hero_region')}</strong></h1><p>{t('slovakia_hero_body')}</p><div className="kosovo-benefits albania-benefits"><article><i>▱</i><div><b>{t('slovakia_delivery')}</b><span>{t('slovakia_delivery_body')}</span></div></article><article><i>◎</i><div><b>{t('slovakia_quality')}</b><span>{t('slovakia_quality_body')}</span></div></article><article><i>♧</i><div><b>{t('slovakia_support')}</b><span>{t('slovakia_support_body')}</span></div></article><article><i>◷</i><div><b>{t('slovakia_time')}</b><span>{t('slovakia_time_body')}</span></div></article></div><div className="kosovo-hero-actions"><Link to="/products">{t('areas_cta_products')}</Link><Link to="/areas">← &nbsp; {t('area_back')}</Link></div></div></section><section className="kosovo-segments"><h2>{t('slovakia_serve_title')}</h2><div className="kosovo-segment-grid">{segments.map(([title,body,image,icon])=><article key={title}><img src={image} alt="" loading="lazy"/><i>{icon}</i><div><h3>{t(title)}</h3><p>{t(body)}</p><Link to="/products" className="albania-learn">{t('about_learn_more')} →</Link></div></article>)}</div></section><section className="kosovo-growth"><i>⌕</i><div><h2>{t('slovakia_growth_title')}</h2><p>{t('slovakia_growth_body')}</p></div><a href="tel:+38349111150">☎ &nbsp; +383 49 111 150</a><a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">{t('footer_book_meeting')}</a></section><div className="kosovo-mobile-contact"><a href="tel:+38349111150">☎ &nbsp; {t('products_call_now')}</a><a href="https://wa.me/38349111150" target="_blank" rel="noopener noreferrer">◉ &nbsp; WhatsApp</a></div></div>;
}

function GermanyDetail({ t, name }) {
  const segments = [['germany_segment_bakeries','germany_segment_bakeries_body',bakeryImage,'♨'],['germany_segment_hotels','germany_segment_hotels_body',hotelImage,'⌂'],['germany_segment_restaurants','germany_segment_restaurants_body',restaurantImage,'♧'],['germany_segment_supermarkets','germany_segment_supermarkets_body',supermarketImage,'▰'],['germany_segment_catering','germany_segment_catering_body',restaurantImage,'⌂']];
  return <div className="kosovo-page hungary-page germany-page"><SEO title={`${name} | ${t('areas_title')}`} description={t('germany_hero_body')} /><section className="kosovo-hero"><img src={germanyHero} alt={t('germany_hero_alt')} className="kosovo-hero-image" fetchPriority="high" /><div className="kosovo-hero-shade" /><div className="kosovo-hero-content"><nav className="kosovo-breadcrumb"><Link to="/areas">{t('areas_title')}</Link> / <span>{name}</span></nav><h1>{t('germany_hero_line_1')}<br />{t('germany_hero_line_2')} <strong>{t('germany_hero_region')}</strong></h1><p>{t('germany_hero_body')}</p><div className="kosovo-benefits albania-benefits"><article><i>▱</i><div><b>{t('germany_delivery')}</b><span>{t('germany_delivery_body')}</span></div></article><article><i>◎</i><div><b>{t('germany_quality')}</b><span>{t('germany_quality_body')}</span></div></article><article><i>♧</i><div><b>{t('germany_support')}</b><span>{t('germany_support_body')}</span></div></article><article><i>◷</i><div><b>{t('germany_time')}</b><span>{t('germany_time_body')}</span></div></article></div><div className="kosovo-hero-actions"><Link to="/products">{t('areas_cta_products')}</Link><Link to="/areas">← &nbsp; {t('area_back')}</Link></div></div></section><section className="kosovo-segments"><h2>{t('germany_serve_title')}</h2><div className="kosovo-segment-grid">{segments.map(([title,body,image,icon])=><article key={title}><img src={image} alt="" loading="lazy"/><i>{icon}</i><div><h3>{t(title)}</h3><p>{t(body)}</p><Link to="/products" className="albania-learn">{t('about_learn_more')} →</Link></div></article>)}</div></section><section className="kosovo-growth"><i>⌕</i><div><h2>{t('germany_growth_title')}</h2><p>{t('germany_growth_body')}</p></div><a href="tel:+38349111150">☎ &nbsp; +383 49 111 150</a><a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">{t('footer_book_meeting')}</a></section><div className="kosovo-mobile-contact"><a href="tel:+38349111150">☎ &nbsp; {t('products_call_now')}</a><a href="https://wa.me/38349111150" target="_blank" rel="noopener noreferrer">◉ &nbsp; WhatsApp</a></div></div>;
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
  if (slug === 'albania') return <AlbaniaDetail t={t} name={name} />;
  if (slug === 'hungary') return <HungaryDetail t={t} name={name} />;
  if (slug === 'croatia') return <CroatiaDetail t={t} name={name} />;
  if (slug === 'slovakia') return <SlovakiaDetail t={t} name={name} />;
  if (slug === 'germany') return <GermanyDetail t={t} name={name} />;

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
