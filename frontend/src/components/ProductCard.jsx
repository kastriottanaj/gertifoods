import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

export default function ProductCard({ product }) {
  const { t } = useLanguage();

  return (
    <div className="product-card">
      {product.image && (
        <img src={product.image} alt={product.name} className="product-card-image" />
      )}
      <div className="product-card-body">
        <h3>{product.name}</h3>
        <p className="product-category">{product.category_name}</p>
        <p className="product-price">
          &euro;{product.price} / {product.unit}
        </p>
        <p className="product-min-order">{t('products_min_order')}: {product.min_order_quantity} {product.unit}</p>
        <Link to={`/products/${product.slug}`} className="btn btn-primary">
          {t('products_view')}
        </Link>
      </div>
    </div>
  );
}
