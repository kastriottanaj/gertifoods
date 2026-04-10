import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { t } = useLanguage();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span>Gerti</span>
          <span className="navbar-brand-green">foods</span>
        </Link>
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
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
}
