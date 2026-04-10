import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import SEO from '../components/SEO';

export default function ProductDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { t } = useLanguage();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api.get(`/products/${slug}/`)
      .then((res) => {
        setProduct(res.data);
        setQuantity(res.data.min_order_quantity);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return <p className="loading">{t('loading')}</p>;
  if (!product) return <p>{t('products_empty')}</p>;

  return (
    <div className="product-detail">
      <SEO
        title={product.name}
        description={product.description?.slice(0, 160)}
      />
      <div className="product-detail-grid">
        {product.image && (
          <img src={product.image} alt={product.name} className="product-detail-image" />
        )}
        <div className="product-detail-info">
          <span className="product-category-badge">{product.category_name}</span>
          <h1>{product.name}</h1>
          <p className="product-detail-price">&euro;{product.price} / {product.unit}</p>
          <p className="product-detail-description">{product.description}</p>
          <p className="product-detail-min">{t('product_min_order')}: {product.min_order_quantity} {product.unit}</p>

          {user && (
            <div className="product-detail-actions">
              <div className="quantity-input">
                <label>{t('product_quantity')} ({product.unit}):</label>
                <input
                  type="number"
                  min={product.min_order_quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(product.min_order_quantity, parseInt(e.target.value) || 0))}
                />
              </div>
              <button onClick={handleAddToCart} className="btn btn-primary btn-lg">
                {added ? t('product_added') : t('product_add_cart')}
              </button>
            </div>
          )}
          {!user && (
            <p className="login-prompt">{t('product_login_prompt')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
