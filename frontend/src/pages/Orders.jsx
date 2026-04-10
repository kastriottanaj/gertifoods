import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import SEO from '../components/SEO';
import api from '../services/api';

export default function Orders() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/')
      .then((res) => setOrders(res.data.results || res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="loading">{t('orders_loading')}</p>;

  return (
    <div className="orders-page">
      <SEO title={t('orders_title')} description={t('orders_meta')} />
      <h1>{t('orders_title')}</h1>
      {orders.length === 0 ? (
        <p>{t('orders_empty')}</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <h3>{t('orders_order')} #{order.id}</h3>
                <span className={`order-status status-${order.status}`}>{order.status}</span>
              </div>
              <p className="order-date">
                {new Date(order.created_at).toLocaleDateString('en-GB', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
              <div className="order-items">
                {order.items.map((item) => (
                  <div key={item.id} className="order-item-row">
                    <span>{item.product_name}</span>
                    <span>{item.quantity} &times; &euro;{item.unit_price}</span>
                    <span>&euro;{item.line_total}</span>
                  </div>
                ))}
              </div>
              <div className="order-total">
                <strong>{t('total')}: &euro;{order.total}</strong>
              </div>
              {order.notes && <p className="order-notes-text">{t('orders_notes')}: {order.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
