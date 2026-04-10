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
      setError(err.response?.data?.detail || t('cart_not_approved'));
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
                onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 0)}
              />
              <span>{item.product.unit}</span>
            </div>
            <div className="cart-item-total">
              &euro;{(item.product.price * item.quantity).toFixed(2)}
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
