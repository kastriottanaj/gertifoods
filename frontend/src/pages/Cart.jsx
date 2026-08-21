import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import SEO from '../components/SEO';
import api from '../services/api';

export default function Cart() {
  const { items, updateQuantity, removeItem, clearCart, total } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmitOrder = async () => {
    if (!user?.is_approved) {
      setError(t('cart_not_approved'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const orderData = {
        notes,
        items: items.map((i) => ({
          product: i.product.id,
          quantity: i.quantity,
        })),
      };
      await api.post('/orders/', orderData);
      clearCart();
      navigate('/orders');
    } catch (err) {
      // `detail` only carries permission errors. Everything else — a quantity
      // below the product's minimum, a line whose product went unavailable —
      // comes back as field errors, and reporting those as "your account is
      // not approved" sent people to sales asking about approval when the real
      // problem was the order. Show what the server actually objected to, and
      // keep the approval message for when that is genuinely the answer.
      const data = err.response?.data;
      const fieldErrors =
        data && typeof data === 'object' && !data.detail
          ? Object.values(data).flat().filter((m) => typeof m === 'string')
          : [];
      setError(data?.detail || fieldErrors.join(' ') || t('cart_not_approved'));
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <SEO title={t('cart_title')} description={t('cart_meta')} />
        <h1>{t('cart_title')}</h1>
        <p>{t('cart_empty')}</p>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <SEO title={t('cart_title')} description={t('cart_meta')} />
      <h1>{t('cart_title')}</h1>
      <div className="cart-items">
        {items.map((item) => (
          <div key={item.product.id} className="cart-item">
            <div className="cart-item-info">
              <h3>{item.product.name}</h3>
              <p>&euro;{item.product.price} / {item.product.unit}</p>
            </div>
            <div className="cart-item-quantity">
              <input
                type="number"
                min={item.product.min_order_quantity}
                value={item.quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  updateQuantity(item.product.id, Number.isNaN(value) ? '' : value);
                }}
                onBlur={() => {
                  const min = item.product.min_order_quantity || 1;
                  if (!item.quantity || item.quantity < min) {
                    updateQuantity(item.product.id, min);
                  }
                }}
              />
              <span>{item.product.unit}</span>
            </div>
            <div className="cart-item-total">
              &euro;{(item.product.price * (item.quantity || 0)).toFixed(2)}
            </div>
            <button onClick={() => removeItem(item.product.id)} className="btn btn-danger btn-sm">
              {t('cart_remove')}
            </button>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <textarea
          placeholder={t('cart_notes')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="order-notes"
        />
        <div className="cart-total">
          <strong>{t('cart_total')}: &euro;{total.toFixed(2)}</strong>
        </div>
        {error && <p className="error-message">{error}</p>}
        <button
          onClick={handleSubmitOrder}
          disabled={submitting}
          className="btn btn-primary btn-lg"
        >
          {submitting ? t('cart_placing') : t('cart_place_order')}
        </button>
      </div>
    </div>
  );
}
