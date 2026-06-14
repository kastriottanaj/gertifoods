import { useLanguage } from '../i18n/LanguageContext';
import SEO from '../components/SEO';

export default function Imprint() {
  const { t } = useLanguage();

  return (
    <div className="imprint-page">
      <SEO title={t('imprint_title')} description={t('imprint_meta')} />
      <h1>{t('imprint_title')}</h1>
      <p className="imprint-intro">{t('imprint_intro')}</p>

      <section className="imprint-section">
        <h2>{t('imprint_company_heading')}</h2>
        <p><strong>Gerti Foods</strong></p>
        <p>{t('footer_address')}</p>
      </section>

      <section className="imprint-section">
        <h2>{t('imprint_contact_heading')}</h2>
        <p>{t('imprint_phone_label')}: <a href="tel:+38349111150">+383 49 111 150</a></p>
        <p>{t('imprint_email_label')}: <a href="mailto:info@gertifoods.com">info@gertifoods.com</a></p>
      </section>

      <section className="imprint-section">
        <h2>{t('imprint_represented_heading')}</h2>
        <p>{t('imprint_represented_label')}: Shpejtim Agushaj</p>
      </section>

      <section className="imprint-section">
        <h2>{t('imprint_register_heading')}</h2>
        <p>{t('imprint_register_label')}: {t('imprint_tbd')}</p>
      </section>

      <section className="imprint-section">
        <h2>{t('imprint_vat_heading')}</h2>
        <p>{t('imprint_vat_label')}: {t('imprint_tbd')}</p>
      </section>

      <section className="imprint-section">
        <h2>{t('imprint_content_heading')}</h2>
        <p>Gerti Foods — {t('footer_address')}</p>
      </section>

      <section className="imprint-section">
        <h2>{t('imprint_disclaimer_heading')}</h2>
        <p>{t('imprint_disclaimer_body')}</p>
      </section>
    </div>
  );
}
