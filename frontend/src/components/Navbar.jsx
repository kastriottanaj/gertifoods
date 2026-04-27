import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import brandLogo from '../assets/gerti-foods-logo.webp';

const CALENDLY_URL = 'https://calendly.com/arlinda-gertifoods/30min';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { t } = useLanguage();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" aria-label="Gerti Foods" onClick={close}>
          <img src={brandLogo} alt="Gerti Foods" />
        </Link>

        {/* Desktop links */}
        <div className="navbar-links">
          <Link to="/products">{t('nav_products')}</Link>
          {user ? (
            <>
              <Link to="/orders">{t('nav_orders')}</Link>
              <Link to="/cart" className="cart-link">
                {t('nav_cart')} {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
              </Link>
              <Link to="/profile">{t('nav_profile')}</Link>
              <button onClick={logout} className="btn-link">{t('nav_logout')}</button>
            </>
          ) : (
            <>
              <Link to="/login">{t('nav_login')}</Link>
              <Link to="/register">{t('nav_register')}</Link>
            </>
          )}
          <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="navbar-book-btn">
            Book a Free Meeting
          </a>
          <LanguageSwitcher />
        </div>

        {/* Hamburger button */}
        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="navbar-mobile">
          <Link to="/products" onClick={close}>{t('nav_products')}</Link>
          {user ? (
            <>
              <Link to="/orders" onClick={close}>{t('nav_orders')}</Link>
              <Link to="/cart" onClick={close}>
                {t('nav_cart')} {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
              </Link>
              <Link to="/profile" onClick={close}>{t('nav_profile')}</Link>
              <button onClick={() => { logout(); close(); }} className="btn-link">{t('nav_logout')}</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={close}>{t('nav_login')}</Link>
              <Link to="/register" onClick={close}>{t('nav_register')}</Link>
            </>
          )}
          <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="navbar-book-btn" onClick={close}>
            Book a Free Meeting
          </a>
          <LanguageSwitcher />
        </div>
      )}
    </nav>
  );
}
