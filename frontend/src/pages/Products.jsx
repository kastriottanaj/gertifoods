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
        <img src={heroImage} alt="Half-baked products" className="products-hero-image" fetchPriority="high" />
        <div className="products-hero-shade" />
        <div className="products-hero-content">
          <h1>Premium Half-Baked<br />Products for Your<br /><strong>Business</strong></h1>
          <p>Consistent quality, authentic taste, and reliable supply —<br />so you can focus on what matters most.</p>
          <div className="products-hero-actions">
            <button type="button" className="products-primary-cta" onClick={scrollToProducts}>View Our Products</button>
            <button type="button" className="products-outline-cta" onClick={() => setSampleModalOpen(true)}>Request a Sample</button>
          </div>
          <div className="products-benefits">
            <div><span className="benefit-icon">♧</span><p><b>Premium Quality</b><small>Carefully selected<br />ingredients</small></p></div>
            <div><span className="benefit-icon">◷</span><p><b>Reliable Supply</b><small>On-time delivery<br />you can count on</small></p></div>
            <div><span className="benefit-icon">❄</span><p><b>Frozen for Freshness</b><small>Locked-in freshness<br />&amp; longer shelf life</small></p></div>
          </div>
        </div>
      </section>

      <section className="products-trust">
        <div className="trust-item trust-rating"><span className="google-g">G</span><div><small>Google Rating</small><b>4.9 <em>★★★★★</em></b><span>(120+ reviews)</span></div></div>
        <div className="trust-item"><span className="trust-red-icon">◎</span><div><small>6+ Years</small><span>Trusted by businesses<br />across Kosovo</span></div></div>
        <div className="trust-item"><span className="trust-red-icon">♢</span><div><small>Food Safety First</small><span>We follow the highest<br />quality standards</span></div></div>
      </section>

      <section className="products-listing" id="products-grid">
        <div className="products-listing-heading"><h2>Our Products</h2><a href="#products-grid">View all products →</a></div>
        {loading ? <p className="loading">{t('products_loading')}</p> : (
          <div className="products-grid">
            {products.map((product, i) => <ProductCard key={product.id} product={product} priority={i < 5} />)}
            {products.length === 0 && <p>{t('products_empty')}</p>}
          </div>
        )}
      </section>

      <section className="products-bottom-cta">
        <div><h2>Ready to Grow Your Business?</h2><p>Let's build a reliable supply partnership.</p></div>
        <div className="products-bottom-actions">
          <a href="tel:+38349111150" className="products-phone">☎ &nbsp; +383 49 111 150</a>
          <a href="https://calendly.com/arlinda-gertifoods/30min" target="_blank" rel="noopener noreferrer">Request a Free Meeting</a>
        </div>
      </section>

      <div className="products-mobile-contact">
        <a href="tel:+38349111150">☎ &nbsp; Call Now</a>
        <a href="https://wa.me/38349111150" target="_blank" rel="noopener noreferrer">◉ &nbsp; WhatsApp</a>
      </div>

      <Modal isOpen={sampleModalOpen} onClose={() => setSampleModalOpen(false)} title={t('sample_form_title')}>
        <SampleRequestForm source="products_hero" onSuccess={() => setSampleModalOpen(false)} />
      </Modal>
    </div>
  );
}
