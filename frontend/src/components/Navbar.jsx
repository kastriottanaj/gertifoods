import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import { areas } from '../data/areas';
import brandLogo from '../assets/gerti-foods-logo.webp';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { t } = useLanguage();
  const [areasOpen, setAreasOpen] = useState(false);
  const areasRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (areasRef.current && !areasRef.current.contains(e.target)) {
        setAreasOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" aria-label="Gerti Foods">
          <img src={brandLogo} alt="Gerti Foods" />
        </Link>
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
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
}
