import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);

// The cart is persisted per tab.
//
// It used to live only in React state, which was survivable in the SPA:
// client-side navigation never unmounted the provider, so the cart only died on
// a refresh. In a multi-page app every navigation IS a page load, so an
// in-memory cart would silently empty itself between the product page and the
// cart page.
//
// sessionStorage is the closest match to the old behaviour — scoped to the tab,
// gone when the tab closes — while additionally surviving a refresh. localStorage
// would keep a forgotten cart alive for days, which is a bigger behavioural
// change than the one being fixed.
const STORAGE_KEY = 'gf_cart';

function readCart() {
  // Guarded for server-side rendering: Astro renders islands to HTML at build
  // time, where there is no sessionStorage.
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      // Lets non-React parts of the page (the navbar's cart badge, which is
      // plain HTML in the Astro build) update without a reload.
      window.dispatchEvent(new CustomEvent('gf:cart-changed', { detail: items }));
    } catch {
      /* storage unavailable (private mode, quota) — cart stays in memory */
    }
  }, [items]);

  const addItem = (product, quantity) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  // Quantity may briefly be '' while the user is retyping a value; items are
  // only removed via removeItem, never as a side effect of editing.
  const updateQuantity = (productId, quantity) => {
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.product.price * (i.quantity || 0), 0);
  const itemCount = items.reduce((sum, i) => sum + (i.quantity || 0), 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
