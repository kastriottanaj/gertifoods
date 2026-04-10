import { useLanguage } from '../i18n/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <div className="footer-brand">
            <span className="footer-brand-red">Gerti</span>{' '}
            <span className="footer-brand-green">foods</span>
          </div>
          <p style={{ marginTop: 12 }}>{t('footer_description')}</p>
          <p>{t('footer_location')}</p>
        </div>
        <div className="footer-section">
          <h4>{t('footer_contact')}</h4>
          <p>info@gertifoods.com</p>
          <p>+383 49 123 456</p>
          <p>{t('footer_location')}</p>
        </div>
        <div className="footer-section">
          <h4>{t('footer_hours')}</h4>
          <p>{t('footer_mon_fri')}</p>
          <p>{t('footer_sat')}</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Gerti Foods. {t('footer_rights')}</p>
      </div>
    </footer>
  );
}
