import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import brandLogo from '../assets/gerti-foods-logo.webp';

const CALENDLY_URL = 'https://calendly.com/arlinda-gertifoods';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section footer-section-brand">
          <img className="footer-brand" src={brandLogo} alt="Gerti Foods" />
          <p style={{ marginTop: 12 }}>{t('footer_description')}</p>
          <p>{t('footer_address')}</p>
        </div>

        <div className="footer-section">
          <h4>{t('footer_contact')}</h4>
          <p><a href="mailto:info@gertifoods.com">info@gertifoods.com</a></p>
          <p><a href="mailto:arlinda@gertifoods.com">arlinda@gertifoods.com</a></p>
          <p><a href="tel:+38349111150">+383 49 111 150</a></p>
        </div>

        <div className="footer-section">
          <h4>{t('footer_hours')}</h4>
          <p>{t('footer_mon_fri')}</p>
          <p>{t('footer_sat')}</p>
        </div>

        <div className="footer-section">
          <h4>{t('footer_col_products')}</h4>
          <ul className="footer-links">
            <li><Link to="/products">{t('category_pizza_title')}</Link></li>
            <li><Link to="/products">{t('category_croissant_title')}</Link></li>
            <li><Link to="/products">{t('category_pite_title')}</Link></li>
            <li><Link to="/products">{t('category_family_title')}</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>{t('footer_col_business')}</h4>
          <ul className="footer-links">
            <li><Link to="/products">{t('segment_bakeries_title')}</Link></li>
            <li><Link to="/products">{t('segment_horeca_title')}</Link></li>
            <li><Link to="/products">{t('segment_retail_title')}</Link></li>
            <li><Link to="/products">{t('segment_catering_title')}</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>{t('footer_col_company')}</h4>
          <ul className="footer-links">
            <li><Link to="/">{t('footer_home')}</Link></li>
            <li><Link to="/products">{t('nav_products')}</Link></li>
            <li><a href="mailto:info@gertifoods.com">{t('footer_contact')}</a></li>
            <li><Link to="/register">{t('nav_register')}</Link></li>
            <li><Link to="/login">{t('nav_login')}</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-certifications">
        {t('footer_certifications')}
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Gerti Foods. {t('footer_rights')}</p>
      </div>
    </footer>
  );
}
