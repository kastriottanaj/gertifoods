import { LanguageProvider } from '../../src/i18n/LanguageContext';
import { AuthProvider } from '../../src/context/AuthContext';
import { CartProvider } from '../../src/context/CartContext';

// Supplies the three providers App.jsx wrapped the whole SPA in. Each island is
// its own React root, so it needs its own providers — which is fine here
// because the portal is one island per page, and the cart is now shared through
// sessionStorage rather than through React state alone.
export default function withProviders(Page) {
  return function WithProviders({ lang, ...props }) {
    return (
      <LanguageProvider initialLang={lang}>
        <AuthProvider>
          <CartProvider>
            <Page {...props} />
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    );
  };
}
