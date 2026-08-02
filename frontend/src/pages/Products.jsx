import { useState, useEffect } from 'react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../i18n/LanguageContext';
import SEO from '../components/SEO';
import Modal from '../components/Modal';
import SampleRequestForm from '../components/SampleRequestForm';
import heroImage from '../assets/about-us.webp';

export default function Products() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sampleModalOpen, setSampleModalOpen] = useState(false);

  useEffect(() => {
    api.get('/products/')
      .then((res) => setProducts(res.data.results || res.data))
      .finally(() => setLoading(false));
  }, []);

  const scrollToProducts = () => document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="products-page products-showcase">
      <SEO title={t('products_title')} description={t('products_meta')} />
      <section className="products-hero">
        <img src={heroImage} alt={t('products_hero_alt')} className="products-hero-image" fetchPriority="high" />
        <div className="products-hero-shade" />
        <div className="products-hero-content">
          <h1>{t('products_hero_line_1')}<br />{t('products_hero_line_2')}<br /><strong>{t('products_hero_business')}</strong></h1>
          <p>{t('products_hero_subtitle')}</p>
          <div className="products-hero-actions">
            <button type="button" className="products-primary-cta" onClick={scrollToProducts}>{t('products_hero_view')}</button>
            <button type="button" className="products-outline-cta" onClick={() => setSampleModalOpen(true)}>{t('products_hero_sample')}</button>
          </div>
          <div className="products-benefits">
            <div><span className="benefit-icon">♧</span><p><b>{t('products_benefit_quality')}</b><small>{t('products_benefit_quality_body')}</small></p></div>
            <div><span className="benefit-icon">◷</span><p><b>{t('products_benefit_supply')}</b><small>{t('products_benefit_supply_body')}</small></p></div>
            <div><span className="benefit-icon">❄</span><p><b>{t('products_benefit_frozen')}</b><small>{t('products_benefit_frozen_body')}</small></p></div>
          </div>
        </div>
      </section>

      <section className="products-trust">
        <div className="trust-item trust-rating"><span className="google-g">G</span><div><small>{t('products_google_rating')}</small><b>4.9 <em>★★★★★</em></b><span>{t('products_reviews')}</span></div></div>
        <div className="trust-item"><span className="trust-red-icon">◎</span><div><small>{t('products_years')}</small><span>{t('products_years_body')}</span></div></div>
        <div className="trust-item"><span className="trust-red-icon">♢</span><div><small>{t('products_food_safety')}</small><span>{t('products_food_safety_body')}</span></div></div>
      </section>

      <section className="products-listing" id="products-grid">
        <div className="products-listing-heading"><h2>{t('products_title')}</h2><a href="#products-grid">{t('products_view_all')}</a></div>
        {loading ? <p className="loading">{t('products_loading')}</p> : (
          <div className="products-grid">
            {products.map((product, i) => <ProductCard key={product.id} product={product} priority={i < 5} />)}
            {products.length === 0 && <p>{t('products_empty')}</p>}
          </div>
        )}
      </section>

      <section className="products-bottom-cta">
        <div><h2>{t('products_growth_title')}</h2><p>{t('products_growth_body')}</p></div>
        <div className="products-bottom-actions">
          <a href="tel:+38349111150" className="products-phone">☎ &nbsp; +383 49 111 150</a>
          <a href="https://calendly.com/arlinda-gertifoods/30min" target="_blank" rel="noopener noreferrer">{t('products_meeting')}</a>
        </div>
      </section>

      <div className="products-mobile-contact">
        <a href="tel:+38349111150">☎ &nbsp; {t('products_call_now')}</a>
        <a href="https://wa.me/38349111150" target="_blank" rel="noopener noreferrer">◉ &nbsp; {t('products_whatsapp')}</a>
      </div>

      <Modal isOpen={sampleModalOpen} onClose={() => setSampleModalOpen(false)} title={t('sample_form_title')}>
        <SampleRequestForm source="products_hero" onSuccess={() => setSampleModalOpen(false)} />
      </Modal>
    </div>
  );
}
