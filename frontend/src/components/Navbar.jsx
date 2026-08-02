import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import { areas } from '../data/areas';
import brandLogo from '../assets/gerti-foods-logo.webp';

const CALENDLY_URL = 'https://calendly.com/arlinda-gertifoods/30min';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [areasOpen, setAreasOpen] = useState(false);
  const [mobileAreasOpen, setMobileAreasOpen] = useState(false);
  const areasRef = useRef(null);

  const close = () => {
    setMenuOpen(false);
    setMobileAreasOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (areasRef.current && !areasRef.current.contains(e.target)) {
        setAreasOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" aria-label="Gerti Foods" onClick={close}>
          {/* Above the fold on every route: stays eager. width/height give the
              browser the intrinsic ratio so the auto-width logo box doesn't
              shift the navbar once the file lands. */}
          <img src={brandLogo} alt="Gerti Foods" width="164" height="89" decoding="async" />
        </Link>

        {/* Desktop links */}
        <div className="navbar-links">
          <Link to="/products">{t('nav_products')}</Link>
          <Link to="/about">{t('nav_about')}</Link>
          <div
            className="nav-dropdown"
            ref={areasRef}
            onMouseEnter={() => setAreasOpen(true)}
            onMouseLeave={() => setAreasOpen(false)}
          >
            <div className="nav-dropdown-trigger">
              <Link to="/areas" onClick={() => setAreasOpen(false)}>{t('nav_areas')}</Link>
              <button
                type="button"
                className="nav-dropdown-caret"
                aria-label={t('nav_areas')}
                aria-expanded={areasOpen}
                onClick={() => setAreasOpen((open) => !open)}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            {areasOpen && (
              <div className="nav-dropdown-menu" role="menu">
                {areas.map((area) => (
                  <Link
                    key={area.slug}
                    to={`/areas/${area.slug}`}
                    role="menuitem"
                    onClick={() => setAreasOpen(false)}
                  >
                    {t(area.nameKey)}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link to="/imprint">{t('nav_imprint')}</Link>
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
            {t('footer_book_meeting')}
          </a>
          <LanguageSwitcher />
        </div>

        {/* Hamburger button */}
        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          aria-controls="navbar-mobile-menu"
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

      {/* Mobile / tablet menu */}
      {menuOpen && <div className="navbar-overlay" onClick={close} aria-hidden="true" />}
      <div
        id="navbar-mobile-menu"
        className={`navbar-mobile ${menuOpen ? 'is-open' : ''}`}
      >
        <Link to="/products" onClick={close}>{t('nav_products')}</Link>
        <Link to="/about" onClick={close}>{t('nav_about')}</Link>

        {/* Areas accordion */}
        <div className="navbar-mobile-accordion">
          <div className="navbar-mobile-accordion-row">
            <Link to="/areas" onClick={close}>{t('nav_areas')}</Link>
            <button
              type="button"
              className="navbar-mobile-accordion-toggle"
              aria-label={t('nav_areas')}
              aria-expanded={mobileAreasOpen}
              onClick={() => setMobileAreasOpen((open) => !open)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 12 12"
                aria-hidden="true"
                style={{ transform: mobileAreasOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              >
                <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          {mobileAreasOpen && (
            <div className="navbar-mobile-subnav">
              {areas.map((area) => (
                <Link key={area.slug} to={`/areas/${area.slug}`} onClick={close}>
                  {t(area.nameKey)}
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link to="/imprint" onClick={close}>{t('nav_imprint')}</Link>

        {user ? (
          <>
            <Link to="/orders" onClick={close}>{t('nav_orders')}</Link>
            <Link to="/cart" className="cart-link" onClick={close}>
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
          {t('footer_book_meeting')}
        </a>
        <LanguageSwitcher />
      </div>
    </nav>
  );
}
