import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import SEO from '../components/SEO';
import heroImage from '../assets/gerti-foods-about-us.webp';
import storyImage from '../assets/bakery-interior.webp';
import pieImage from '../assets/products/Pie.webp';
import familyImage from '../assets/products/Family-pack.webp';

const CALENDLY_URL = 'https://calendly.com/arlinda-gertifoods/30min';

export default function About() {
  const { t } = useLanguage();

  return (
    <div className="about-page about-showcase">
      <SEO title={t('about_title')} description={t('about_meta')} />

      <section className="about-hero">
        <img src={heroImage} alt={t('about_hero_alt')} className="about-hero-image" fetchPriority="high" />
        <div className="about-hero-shade" />
        <div className="about-hero-content">
          <h1>{t('about_hero_line_1')}<br />{t('about_hero_line_2')} <strong>{t('about_hero_audience')}</strong></h1>
          <p>{t('about_hero_body')}</p>
          <div className="about-hero-actions">
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">{t('footer_book_meeting')}</a>
            <Link to="/products">{t('about_see_products')}</Link>
          </div>
          <div className="about-contact-line">
            <a href="tel:+38349111150">☎ &nbsp; +383 49 111 150</a><span>•</span><span>⌖ &nbsp; {t('about_based_prizren')}</span><span>•</span><span>{t('about_serving_kosovo')}</span>
          </div>
        </div>
      </section>

      <section className="about-facts">
        <div className="about-fact about-google"><span className="about-google-g">G</span><div><small>{t('products_google_rating')}</small><b>4.9 <em>★★★★★</em></b><span>{t('products_reviews')}</span></div></div>
        <div className="about-fact"><i>◎</i><div><b>ISO 22000</b><span>{t('about_certified_quality')}</span></div></div>
        <div className="about-fact"><i>▣</i><div><b>{t('about_founded')}</b><span>2024</span></div></div>
        <div className="about-fact"><i>♨</i><div><b>600+ {t('about_years')}</b><span>{t('about_hasi_heritage')}</span></div></div>
        <div className="about-fact"><i>◴</i><div><b>6,000</b><span>{t('about_tortillas_hour')}</span></div></div>
      </section>

      <section className="about-benefits">
        <h2 className="about-mobile-benefits-title">{t('about_choose_title')}</h2>
        <article><i>♢</i><div><h3>{t('about_benefit_quality')}</h3><p>{t('about_benefit_quality_body')}</p></div></article>
        <article><i>◷</i><div><h3>{t('about_benefit_service')}</h3><p>{t('about_benefit_service_body')}</p></div></article>
        <article><i>▱</i><div><h3>{t('about_benefit_supply')}</h3><p>{t('about_benefit_supply_body')}</p></div></article>
      </section>

      <section className="about-story-grid">
        <div className="about-story-copy">
          <h2>{t('about_story_heading')}</h2>
          <p>{t('about_story_body_1')}</p>
          <p>{t('about_story_body_2')}</p>
          <ul><li>{t('about_story_point_1')}</li><li>{t('about_story_point_2')}</li><li>{t('about_story_point_3')}</li></ul>
        </div>
        <img src={storyImage} alt={t('about_story_image_alt')} loading="lazy" />
        <div className="about-choose">
          <h2>{t('about_choose_title')}</h2>
          <article><i>◎</i><div><b>{t('about_choose_local')}</b><p>{t('about_choose_local_body')}</p></div></article>
          <article><i>◷</i><div><b>{t('about_choose_success')}</b><p>{t('about_choose_success_body')}</p></div></article>
          <article><i>▱</i><div><b>{t('about_choose_partner')}</b><p>{t('about_choose_partner_body')}</p></div></article>
        </div>
      </section>

      <section className="about-lower-grid">
        <div className="about-reviews">
          <div className="about-section-heading"><h2>{t('about_trusted_title')}</h2><a href="#reviews">{t('about_view_reviews')} →</a></div>
          <div className="about-review-cards" id="reviews">
            <article><span className="review-logo">T</span><div><b>Hotel Theranda</b><em>★★★★★</em><p>“{t('about_review_1')}”</p><small>— F. Gashi, Purchasing Manager</small></div></article>
            <article><span className="review-logo review-logo-green">P</span><div><b>Peka House</b><em>★★★★★</em><p>“{t('about_review_2')}”</p><small>— D. Krasniqi, Owner</small></div></article>
          </div>
        </div>
        <div className="about-solutions">
          <h2>{t('about_solutions_title')}</h2>
          <div className="about-solution-cards">
            <article><img src={pieImage} alt="" /><b>{t('about_solution_pies')}</b><p>{t('about_solution_pies_body')}</p><Link to="/products">{t('about_view_products')} →</Link></article>
            <article><img src={familyImage} alt="" /><b>{t('about_solution_tortillas')}</b><p>{t('about_solution_tortillas_body')}</p><Link to="/products">{t('about_view_products')} →</Link></article>
            <article><img src={familyImage} alt="" /><b>{t('about_solution_family')}</b><p>{t('about_solution_family_body')}</p><Link to="/products">{t('about_view_products')} →</Link></article>
            <article><img src={storyImage} alt="" /><b>{t('about_solution_service')}</b><p>{t('about_solution_service_body')}</p><Link to="/areas">{t('about_learn_more')} →</Link></article>
          </div>
        </div>
      </section>

      <section className="about-bottom-cta">
        <div><h2>{t('about_partner_title')}</h2><p>{t('about_partner_body')}</p></div>
        <div><a href="tel:+38349111150" className="about-phone">☎ &nbsp; {t('about_call')} +383 49 111 150</a><a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">{t('footer_book_meeting')}</a></div>
      </section>

      <div className="about-mobile-contact"><a href="tel:+38349111150">☎ &nbsp; {t('products_call_now')}</a><a href="https://wa.me/38349111150" target="_blank" rel="noopener noreferrer">◉ &nbsp; WhatsApp</a></div>
    </div>
  );
}
