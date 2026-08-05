import { useEffect, useState } from 'react';
import withProviders from './withProviders.jsx';
import { useAuth } from '../../src/context/AuthContext';
import { useCart } from '../../src/context/CartContext';
import { useLanguage } from '../../src/i18n/LanguageContext';

// The signed-in half of ProductDetail.jsx — the quantity input and add-to-cart
// button. The product data comes from the build-time catalogue as props rather
// than a fetch, since the surrounding page already has it.
//
// The signed-out branch stays in the static HTML (ProductDetail.astro renders
// the login prompt), so an anonymous visitor — which is everyone the SEO work
// serves — sees the finished page with no JavaScript and no flash. This island
// only removes that prompt once a session is confirmed.
function ProductActionsInner({ product }) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState(product.min_order_quantity);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const prompt = document.querySelector('[data-product-anon]');
    if (prompt) prompt.style.display = user ? 'none' : '';
  }, [user]);

  if (!user) return null;

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="product-detail-actions">
      <div className="quantity-input">
        <label>{t('product_quantity')} ({product.unit}):</label>
        <input
          type="number"
          min={product.min_order_quantity}
          value={quantity}
          onChange={(e) =>
            setQuantity(Math.max(product.min_order_quantity, parseInt(e.target.value) || 0))
          }
        />
      </div>
      <button onClick={handleAddToCart} className="btn btn-primary btn-lg">
        {added ? t('product_added') : t('product_add_cart')}
      </button>
    </div>
  );
}

export default withProviders(ProductActionsInner);
