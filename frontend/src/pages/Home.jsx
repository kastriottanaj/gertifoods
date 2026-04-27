import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import SEO from '../components/SEO';
import Modal from '../components/Modal';
import SampleRequestForm from '../components/SampleRequestForm';
import CatalogRequestForm from '../components/CatalogRequestForm';
import HeroLeadForm from '../components/HeroLeadForm';
import factoryImg from '../assets/gerti-foods.webp';
import isoCertificateImg from '../assets/iso-certificate.webp';
import pizzaImg from '../assets/products/pizza.webp';
import croissantImg from '../assets/products/Croissant.webp';
import pieImg from '../assets/products/Pie.webp';
import familyPackImg from '../assets/products/Family-pack.webp';
import './Home.css';

const WA_PHONE = '38349111150';
const TEL_HREF = 'tel:+38349111150';
const CALENDLY_URL = 'https://calendly.com/arlinda-gertifoods';

export default function Home() {
  const { t } = useLanguage();
  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const waHref = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(t('whatsapp_greeting'))}`;

  return (
    <div className="home">
      <SEO title={t('home_title')} description={t('home_meta')} />

      <section className="home-hero">
        <div
          className="home-hero-bg"
          style={{ backgroundImage: `url(${factoryImg})` }}
          role="img"
          aria-label="Gerti Foods factory in Prizren, Kosovo"
        />
        <div className="home-hero-overlay" />

        <div className="home-hero-grid">
          <div className="home-hero-copy">
            <span className="home-hero-eyebrow">{t('home_hero_eyebrow')}</span>
            <h1 className="home-hero-title">{t('home_hero_title')}</h1>
            <p className="home-hero-subtitle">{t('home_hero_subtitle')}</p>
            <p className="home-hero-trust">{t('home_hero_trust')}</p>

            <img
              className="home-hero-badge"
              src={isoCertificateImg}
              alt={t('hero_badge_alt')}
              loading="lazy"
            />

            <div className="home-hero-stats">
              <div className="home-hero-stat">
                <span className="stat-value">5</span>
                <span className="stat-label">{t('hero_stat_certs_label')}</span>
              </div>
              <div className="home-hero-stat">
                <span className="stat-value">600+</span>
                <span className="stat-label">{t('hero_stat_years_label')}</span>
              </div>
              <div className="home-hero-stat">
                <span className="stat-value">6,000</span>
                <span className="stat-label">{t('hero_stat_capacity_label')}</span>
              </div>
              <div className="home-hero-stat">
                <span className="stat-value">15–20</span>
                <span className="stat-label">{t('hero_stat_baketime_label')}</span>
              </div>
            </div>
          </div>

          <div className="home-hero-cta">
            <div className="home-hero-card">
              <HeroLeadForm source="home_hero" />
            </div>

            <div className="home-hero-direct">
              <span className="home-hero-divider">{t('hero_divider')}</span>
              <a
                className="home-hero-wa"
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    fill="currentColor"
                    d="M19.05 4.91A9.82 9.82 0 0012.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.33 4.97L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.02zM12.04 20.13h-.01a8.2 8.2 0 01-4.18-1.14l-.3-.18-3.12.82.83-3.04-.19-.31a8.18 8.18 0 01-1.26-4.37c0-4.54 3.7-8.23 8.23-8.23 2.2 0 4.27.86 5.82 2.41a8.17 8.17 0 012.41 5.82c0 4.54-3.69 8.23-8.23 8.23zm4.51-6.16c-.25-.12-1.46-.72-1.68-.8-.23-.08-.39-.12-.56.12-.17.25-.64.8-.79.97-.15.17-.29.19-.54.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.22-1.46-1.37-1.71-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.12-.15.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.77-1.84-.2-.48-.41-.42-.56-.42-.15-.01-.31-.01-.48-.01-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.43 1.02 2.6.12.17 1.78 2.72 4.31 3.81.6.26 1.07.41 1.44.53.61.19 1.16.17 1.59.1.49-.07 1.5-.61 1.71-1.21.21-.6.21-1.11.15-1.21-.06-.1-.23-.17-.48-.29z"
                  />
                </svg>
                {t('hero_whatsapp_inline')}
              </a>
              <a className="home-hero-tel" href={TEL_HREF}>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    fill="currentColor"
                    d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2a15.05 15.05 0 01-6.59-6.59l2.2-2.2c.28-.28.36-.67.25-1.02A11.4 11.4 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z"
                  />
                </svg>
                {t('hero_phone_inline')}
              </a>

            </div>
          </div>
        </div>
      </section>

      <section className="home-segments">
        <div className="home-segments-inner">
          <span className="home-segments-eyebrow">{t('segments_eyebrow')}</span>
          <h2 className="home-segments-title">{t('segments_title')}</h2>
          <p className="home-segments-subtitle">{t('segments_subtitle')}</p>

          <div className="home-segments-grid">
            <a href="#products" className="home-segment">
              <span className="home-segment-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2c-1.1 0-2 .9-2 2 0 .38.1.73.29 1.03L8 8v13h2v-7h4v7h2V8l-2.29-2.97c.19-.3.29-.65.29-1.03 0-1.1-.9-2-2-2zm-6 8c-1.1 0-2 .9-2 2v9h2v-9zm12 0v11h2v-9c0-1.1-.9-2-2-2z"/>
                </svg>
              </span>
              <h3 className="home-segment-title">{t('segment_bakeries_title')}</h3>
              <p className="home-segment-body">{t('segment_bakeries_body')}</p>
              <span className="home-segment-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                </svg>
              </span>
            </a>

            <a href="#products" className="home-segment">
              <span className="home-segment-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.1 13.34l2.83-2.83L3.91 3.5a4 4 0 000 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z"/>
                </svg>
              </span>
              <h3 className="home-segment-title">{t('segment_horeca_title')}</h3>
              <p className="home-segment-body">{t('segment_horeca_body')}</p>
              <span className="home-segment-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                </svg>
              </span>
            </a>

            <a href="#products" className="home-segment">
              <span className="home-segment-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm0 10c-2.76 0-5-2.24-5-5h2c0 1.66 1.34 3 3 3s3-1.34 3-3h2c0 2.76-2.24 5-5 5z"/>
                </svg>
              </span>
              <h3 className="home-segment-title">{t('segment_retail_title')}</h3>
              <p className="home-segment-body">{t('segment_retail_body')}</p>
              <span className="home-segment-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                </svg>
              </span>
            </a>

            <a href="#products" className="home-segment">
              <span className="home-segment-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm12.5-9.5l1.96 2.5H17V9h1.5zM18 18.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/>
                </svg>
              </span>
              <h3 className="home-segment-title">{t('segment_catering_title')}</h3>
              <p className="home-segment-body">{t('segment_catering_body')}</p>
              <span className="home-segment-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                </svg>
              </span>
            </a>
          </div>
        </div>
      </section>

      <Modal
        isOpen={sampleModalOpen}
        onClose={() => setSampleModalOpen(false)}
        title={t('sample_form_title')}
      >
        <SampleRequestForm
          source="home_hero"
          onSuccess={() => sessionStorage.setItem('sample_request_submitted', '1')}
        />
      </Modal>

      <section className="home-pain">
        <div className="home-pain-inner">
          <span className="home-pain-eyebrow">{t('pain_eyebrow')}</span>
          <h2 className="home-pain-title">{t('pain_title')}</h2>
          <p className="home-pain-subtitle">{t('pain_subtitle')}</p>

          <div className="home-pain-grid">
            <div className="home-pain-col home-pain-col-without">
              <span className="home-pain-col-label">{t('pain_without_label')}</span>
              <ul className="home-pain-list">
                <li>
                  <h3>{t('pain_without_1_title')}</h3>
                  <p>{t('pain_without_1_body')}</p>
                </li>
                <li>
                  <h3>{t('pain_without_2_title')}</h3>
                  <p>{t('pain_without_2_body')}</p>
                </li>
                <li>
                  <h3>{t('pain_without_3_title')}</h3>
                  <p>{t('pain_without_3_body')}</p>
                </li>
              </ul>
            </div>

            <div className="home-pain-col home-pain-col-with">
              <span className="home-pain-col-label">{t('pain_with_label')}</span>
              <ul className="home-pain-list">
                <li>
                  <h3>{t('pain_with_1_title')}</h3>
                  <p>{t('pain_with_1_body')}</p>
                </li>
                <li>
                  <h3>{t('pain_with_2_title')}</h3>
                  <p>{t('pain_with_2_body')}</p>
                </li>
                <li>
                  <h3>{t('pain_with_3_title')}</h3>
                  <p>{t('pain_with_3_body')}</p>
                </li>
              </ul>
            </div>
          </div>

          <button
            type="button"
            className="home-pain-cta"
            onClick={() => setSampleModalOpen(true)}
          >
            {t('pain_cta')}
          </button>
        </div>
      </section>

      <section className="home-pillars">
        <div className="home-pillars-inner">
          <span className="home-pillars-eyebrow">{t('pillars_eyebrow')}</span>
          <h2 className="home-pillars-title">{t('pillars_title')}</h2>
          <p className="home-pillars-subtitle">{t('pillars_subtitle')}</p>

          <div className="home-pillars-grid">
            <article className="home-pillar">
              <div className="home-pillar-icon home-pillar-icon-1" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.5 0.67c.74 2.65 3.25 4.73 3.25 7.33 0 2.09-1.67 3.78-3.75 3.78-1.23 0-2.37-.61-3.05-1.64-.4.63-1.1 1.05-1.89 1.05-1.22 0-2.23-1-2.23-2.22 0-.8.4-1.5 1.02-1.91-.48 3.77 2.12 7.43 5.96 7.43 4.07 0 6.19-3.27 6.19-6.75 0-3.16-2-5.97-5.5-7.07z"/>
                </svg>
              </div>
              <span className="home-pillar-number">01</span>
              <h3 className="home-pillar-title">{t('pillar_1_title')}</h3>
              <p className="home-pillar-body">{t('pillar_1_body')}</p>
            </article>

            <article className="home-pillar">
              <div className="home-pillar-icon home-pillar-icon-2" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                </svg>
              </div>
              <span className="home-pillar-number">02</span>
              <h3 className="home-pillar-title">{t('pillar_2_title')}</h3>
              <p className="home-pillar-body">{t('pillar_2_body')}</p>
            </article>

            <article className="home-pillar">
              <div className="home-pillar-icon home-pillar-icon-3" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1 2 6v2h20V6L12 1zm-7 9v7H3v2h18v-2h-2v-7h-2v7h-3v-7h-2v7h-2v-7H8v7H5v-7z"/>
                </svg>
              </div>
              <span className="home-pillar-number">03</span>
              <h3 className="home-pillar-title">{t('pillar_3_title')}</h3>
              <p className="home-pillar-body">{t('pillar_3_body')}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="home-categories" id="products">
        <div className="home-categories-inner">
          <span className="home-categories-eyebrow">{t('categories_eyebrow')}</span>
          <h2 className="home-categories-title">{t('categories_title')}</h2>
          <p className="home-categories-subtitle">{t('categories_subtitle')}</p>

          <div className="home-categories-grid">
            <Link to="/products" className="home-category">
              <div className="home-category-image">
                <img
                  src={pizzaImg}
                  alt={t('category_pizza_alt')}
                  loading="lazy"
                />
              </div>
              <div className="home-category-body">
                <h3>{t('category_pizza_title')}</h3>
                <p>{t('category_pizza_desc')}</p>
              </div>
            </Link>

            <Link to="/products" className="home-category">
              <div className="home-category-image">
                <img
                  src={croissantImg}
                  alt={t('category_croissant_alt')}
                  loading="lazy"
                />
              </div>
              <div className="home-category-body">
                <h3>{t('category_croissant_title')}</h3>
                <p>{t('category_croissant_desc')}</p>
              </div>
            </Link>

            <Link to="/products" className="home-category">
              <div className="home-category-image">
                <img
                  src={pieImg}
                  alt={t('category_pite_alt')}
                  loading="lazy"
                />
              </div>
              <div className="home-category-body">
                <h3>{t('category_pite_title')}</h3>
                <p>{t('category_pite_desc')}</p>
              </div>
            </Link>

            <Link to="/products" className="home-category">
              <div className="home-category-image">
                <img
                  src={familyPackImg}
                  alt={t('category_family_alt')}
                  loading="lazy"
                />
              </div>
              <div className="home-category-body">
                <h3>{t('category_family_title')}</h3>
                <p>{t('category_family_desc')}</p>
              </div>
            </Link>
          </div>

          <div className="home-categories-footer">
            <Link to="/products" className="home-categories-cta">
              {t('categories_cta')}
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <section className="home-process">
        <div className="home-process-inner">
          <span className="home-process-eyebrow">{t('process_eyebrow')}</span>
          <h2 className="home-process-title">{t('process_title')}</h2>
          <p className="home-process-subtitle">{t('process_subtitle')}</p>

          <ol className="home-process-steps">
            <li className="home-process-step">
              <span className="home-process-step-num">01</span>
              <h3 className="home-process-step-title">{t('process_step_1_title')}</h3>
              <p className="home-process-step-body">{t('process_step_1_body')}</p>
            </li>
            <li className="home-process-step">
              <span className="home-process-step-num">02</span>
              <h3 className="home-process-step-title">{t('process_step_2_title')}</h3>
              <p className="home-process-step-body">{t('process_step_2_body')}</p>
            </li>
            <li className="home-process-step">
              <span className="home-process-step-num">03</span>
              <h3 className="home-process-step-title">{t('process_step_3_title')}</h3>
              <p className="home-process-step-body">{t('process_step_3_body')}</p>
            </li>
          </ol>

          <button
            type="button"
            className="home-process-cta"
            onClick={() => setSampleModalOpen(true)}
          >
            {t('process_cta')}
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
            </svg>
          </button>
        </div>
      </section>

      <section className="home-capacity">
        <div className="home-capacity-inner">
          <span className="home-capacity-eyebrow">{t('capacity_eyebrow')}</span>
          <h2 className="home-capacity-title">{t('capacity_title')}</h2>
          <p className="home-capacity-subtitle">{t('capacity_subtitle')}</p>

          <div className="home-capacity-grid">
            <div className="home-capacity-stat">
              <span className="home-capacity-value">6,000</span>
              <span className="home-capacity-label">{t('capacity_stat_croissant')}</span>
            </div>
            <div className="home-capacity-stat">
              <span className="home-capacity-value">6,000</span>
              <span className="home-capacity-label">{t('capacity_stat_danish')}</span>
            </div>
            <div className="home-capacity-stat">
              <span className="home-capacity-value">3,000</span>
              <span className="home-capacity-label">{t('capacity_stat_tortilla')}</span>
            </div>
            <div className="home-capacity-stat">
              <span className="home-capacity-value">1,300</span>
              <span className="home-capacity-label">{t('capacity_stat_pizza')}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-heritage">
        <div className="home-heritage-inner">
          <span className="home-heritage-eyebrow">{t('heritage_eyebrow')}</span>
          <h2 className="home-heritage-title">{t('heritage_title')}</h2>
          <p className="home-heritage-body">{t('heritage_body')}</p>

          <div className="home-heritage-facts">
            <div className="home-heritage-fact">
              <span className="home-heritage-fact-value">3</span>
              <span className="home-heritage-fact-label">{t('heritage_fact_partners')}</span>
            </div>
            <div className="home-heritage-fact">
              <span className="home-heritage-fact-value">600</span>
              <span className="home-heritage-fact-label">{t('heritage_fact_years')}</span>
            </div>
            <div className="home-heritage-fact">
              <span className="home-heritage-fact-value">2024</span>
              <span className="home-heritage-fact-label">{t('heritage_fact_founded')}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-final">
        <div className="home-final-inner">
          <h2 className="home-final-title">{t('final_cta_title')}</h2>
          <p className="home-final-body">{t('final_cta_body')}</p>

          <div className="home-final-ctas">
            <button
              type="button"
              className="home-final-cta-primary"
              onClick={() => setSampleModalOpen(true)}
            >
              {t('final_cta_primary')}
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
              </svg>
            </button>
            <button
              type="button"
              className="home-final-cta-catalog"
              onClick={() => setCatalogModalOpen(true)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
              </svg>
              {t('final_cta_catalog')}
            </button>
            <a
              className="home-final-cta-whatsapp"
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  fill="currentColor"
                  d="M19.05 4.91A9.82 9.82 0 0012.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.33 4.97L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.02zM12.04 20.13h-.01a8.2 8.2 0 01-4.18-1.14l-.3-.18-3.12.82.83-3.04-.19-.31a8.18 8.18 0 01-1.26-4.37c0-4.54 3.7-8.23 8.23-8.23 2.2 0 4.27.86 5.82 2.41a8.17 8.17 0 012.41 5.82c0 4.54-3.69 8.23-8.23 8.23zm4.51-6.16c-.25-.12-1.46-.72-1.68-.8-.23-.08-.39-.12-.56.12-.17.25-.64.8-.79.97-.15.17-.29.19-.54.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.22-1.46-1.37-1.71-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.12-.15.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.77-1.84-.2-.48-.41-.42-.56-.42-.15-.01-.31-.01-.48-.01-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.43 1.02 2.6.12.17 1.78 2.72 4.31 3.81.6.26 1.07.41 1.44.53.61.19 1.16.17 1.59.1.49-.07 1.5-.61 1.71-1.21.21-.6.21-1.11.15-1.21-.06-.1-.23-.17-.48-.29z"
                />
              </svg>
              {t('final_cta_whatsapp')}
            </a>
          </div>
        </div>
      </section>

      <Modal
        isOpen={catalogModalOpen}
        onClose={() => setCatalogModalOpen(false)}
        title={t('catalog_modal_title')}
      >
        <CatalogRequestForm
          onSuccess={() => sessionStorage.setItem('catalog_request_submitted', '1')}
        />
      </Modal>
    </div>
  );
}
