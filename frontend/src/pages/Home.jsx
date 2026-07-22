import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import SEO from '../components/SEO';
import Modal from '../components/Modal';
import SampleRequestForm from '../components/SampleRequestForm';
import CatalogRequestForm from '../components/CatalogRequestForm';
import HeroLeadForm from '../components/HeroLeadForm';
import pieImg from '../assets/products/Pie.webp';
import familyPackImg from '../assets/products/Family-pack.webp';
import bakeryInteriorImg from '../assets/bakery-interior.webp';
import './Home.css';

const CALENDLY_URL = 'https://calendly.com/arlinda-gertifoods/30min';
const CERTS = ['ISO 22000', 'HACCP', 'IFS', 'BRC', 'Halal'];

export default function Home() {
  const { t } = useLanguage();
  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);

  return (
    <div className="home">
      <SEO title={t('home_title')} description={t('home_meta')} />

      <section className="home-hero">
        <img
          className="home-hero-bg"
          src="/hero.webp"
          alt={t('hero_bg_alt')}
          fetchPriority="high"
        />
        <div className="home-hero-overlay" />

        <div className="home-hero-grid">
          <div className="home-hero-copy">
            <span className="home-hero-eyebrow">{t('home_hero_eyebrow')}</span>
            <h1 className="home-hero-title">{t('home_hero_title')}</h1>
            <p className="home-hero-subtitle">{t('home_hero_subtitle')}</p>

            <div className="home-hero-actions">
              <button
                type="button"
                className="home-hero-btn-primary"
                onClick={() => setSampleModalOpen(true)}
              >
                {t('home_hero_cta_samples')}
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                </svg>
              </button>
              <Link to="/products" className="home-hero-btn-secondary">
                {t('home_hero_cta_products')}
              </Link>
            </div>
          </div>

          <div className="home-hero-cta">
            <div className="home-hero-card">
              <HeroLeadForm source="home_hero" />
            </div>
          </div>
        </div>

        <div className="home-hero-bar">
          <div className="home-hero-baritem">
            <span className="home-hero-baricon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
              </svg>
            </span>
            <span className="home-hero-bartext">
              <span className="home-hero-barvalue">ISO 22000</span>
              <span className="home-hero-barlabel">{t('hero_stat_certs_label')}</span>
            </span>
          </div>
          <div className="home-hero-baritem">
            <span className="home-hero-baricon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C9.5 6 8 9 8 12a4 4 0 008 0c0-3-1.5-6-4-10zm-6.5 8C4 12.5 3.5 14.5 4 17c2.2.3 4.2-.6 5.2-2.3-1.4-.8-2.6-2.2-3.7-4.7zm13 0c-1.1 2.5-2.3 3.9-3.7 4.7 1 1.7 3 2.6 5.2 2.3.5-2.5 0-4.5-1.5-7z"/>
              </svg>
            </span>
            <span className="home-hero-bartext">
              <span className="home-hero-barvalue">600</span>
              <span className="home-hero-barlabel">{t('hero_stat_years_label')}</span>
            </span>
          </div>
          <div className="home-hero-baritem">
            <span className="home-hero-baricon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z"/>
              </svg>
            </span>
            <span className="home-hero-bartext">
              <span className="home-hero-barvalue">3,000<span className="home-hero-barunit">/{t('hero_bar_per_hour')}</span></span>
              <span className="home-hero-barlabel">{t('hero_stat_capacity_label')}</span>
            </span>
          </div>
          <div className="home-hero-baritem">
            <span className="home-hero-baricon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
            </span>
            <span className="home-hero-bartext">
              <span className="home-hero-barvalue">15–20 min</span>
              <span className="home-hero-barlabel">{t('hero_stat_baketime_label')}</span>
            </span>
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
              <div className="home-pillar-text">
                <h3 className="home-pillar-title">{t('pillar_1_title')}</h3>
                <p className="home-pillar-body">{t('pillar_1_body')}</p>
              </div>
            </article>

            <article className="home-pillar">
              <div className="home-pillar-icon home-pillar-icon-2" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                </svg>
              </div>
              <div className="home-pillar-text">
                <h3 className="home-pillar-title">{t('pillar_2_title')}</h3>
                <p className="home-pillar-body">{t('pillar_2_body')}</p>
              </div>
            </article>

            <article className="home-pillar">
              <div className="home-pillar-icon home-pillar-icon-3" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1 2 6v2h20V6L12 1zm-7 9v7H3v2h18v-2h-2v-7h-2v7h-3v-7h-2v7h-2v-7H8v7H5v-7z"/>
                </svg>
              </div>
              <div className="home-pillar-text">
                <h3 className="home-pillar-title">{t('pillar_3_title')}</h3>
                <p className="home-pillar-body">{t('pillar_3_body')}</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="home-categories" id="products">
        <div className="home-categories-inner">
          <div className="home-categories-intro">
            <span className="home-categories-eyebrow">{t('categories_eyebrow')}</span>
            <h2 className="home-categories-title">{t('categories_title')}</h2>
            <p className="home-categories-subtitle">{t('categories_subtitle')}</p>
            <Link to="/products" className="home-categories-cta">
              {t('categories_cta')}
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
              </svg>
            </Link>
          </div>

          <div className="home-categories-grid">
            <Link to="/products" className="home-category">
              <div className="home-category-image">
                <img src={pieImg} alt={t('category_pite_alt')} loading="lazy" />
              </div>
              <div className="home-category-body">
                <h3>{t('category_pite_title')}</h3>
                <p>{t('category_pite_desc')}</p>
                <span className="home-category-cta">
                  {t('categories_view_range')}
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                  </svg>
                </span>
              </div>
            </Link>

            <Link to="/products" className="home-category">
              {/* TODO: swap for a real tortilla photo once the shoot lands */}
              <div className="home-category-image home-category-image-placeholder" role="img" aria-label={t('category_tortilla_alt')}>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path fill="currentColor" d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2.5a7.5 7.5 0 110 15 7.5 7.5 0 010-15zM9 8a1.2 1.2 0 100 2.4A1.2 1.2 0 009 8zm6 1.5a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4zm-4.5 4a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z"/>
                </svg>
              </div>
              <div className="home-category-body">
                <h3>{t('category_tortilla_title')}</h3>
                <p>{t('category_tortilla_desc')}</p>
                <span className="home-category-cta">
                  {t('categories_view_range')}
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                  </svg>
                </span>
              </div>
            </Link>

            <Link to="/products" className="home-category">
              <div className="home-category-image">
                <img src={familyPackImg} alt={t('category_family_alt')} loading="lazy" />
              </div>
              <div className="home-category-body">
                <h3>{t('category_family_title')}</h3>
                <p>{t('category_family_desc')}</p>
                <span className="home-category-cta">
                  {t('categories_view_range')}
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                  </svg>
                </span>
              </div>
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
              <span className="home-capacity-value">3,000</span>
              <span className="home-capacity-label">{t('capacity_stat_tortilla')}</span>
            </div>
            <div className="home-capacity-stat">
              <span className="home-capacity-value">800</span>
              <span className="home-capacity-label">{t('capacity_stat_byrek')}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-heritage">
        <div className="home-heritage-inner">
          <div className="home-heritage-copy">
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

          <div className="home-heritage-media">
            <img
              className="home-heritage-img"
              src={bakeryInteriorImg}
              alt={t('heritage_img_alt')}
              loading="lazy"
              width="900"
              height="1350"
            />
            <div className="home-heritage-certs">
              <span className="home-heritage-certs-label">{t('heritage_certs_label')}</span>
              <div className="home-heritage-certs-row">
                {CERTS.map((cert) => (
                  <span key={cert} className="home-heritage-cert-badge">{cert}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-final">
        <div className="home-final-inner">
          <div className="home-final-text">
            <h2 className="home-final-title">{t('final_cta_title')}</h2>
            <p className="home-final-body">{t('final_cta_body')}</p>
          </div>

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

      <div className="home-sticky-cta">
        <button type="button" onClick={() => setSampleModalOpen(true)}>
          {t('home_hero_cta_samples')}
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
