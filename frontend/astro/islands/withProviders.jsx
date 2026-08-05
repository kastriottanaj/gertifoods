import IslandLanguage from './IslandLanguage.jsx';
import { AuthProvider } from '../../src/context/AuthContext';
import { CartProvider } from '../../src/context/CartContext';

// Supplies the three providers App.jsx wrapped the whole SPA in. Each island is
// its own React root, so it needs its own providers — which is fine here
// because the portal is one island per page, and the cart is now shared through
// sessionStorage rather than through React state alone.
//
// The language context comes from IslandLanguage, which takes its strings as a
// prop, so islands don't pull the full three-language table into their bundle.
export default function withProviders(Page) {
  return function WithProviders({ lang, messages, ...props }) {
    return (
      <IslandLanguage lang={lang} messages={messages}>
        <AuthProvider>
          <CartProvider>
            <Page {...props} />
          </CartProvider>
        </AuthProvider>
      </IslandLanguage>
    );
  };
}
