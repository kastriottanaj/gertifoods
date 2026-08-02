import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

// `priority` marks the cards the grid puts in its first row: those can be the
// LCP element, so they load eagerly. Everything further down the grid is
// lazy-loaded. The card image box is fixed by CSS (.product-card-image), so no
// intrinsic width/height attribute is needed to keep the layout stable.
export default function ProductCard({ product, priority = false }) {
  const { t } = useLanguage();
  const productName = t(`products_name_${product.slug.replaceAll('-', '_')}`);
  const categoryKey = product.category_name === 'Family Pack' ? 'products_category_family_pack' : 'products_category_pite';
  const unitKey = product.unit === 'pack' ? 'products_unit_pack' : 'products_unit_piece';
  const unit = t(unitKey);

  return (
    <div className="product-card">
      {product.image && (
        <img
          src={product.image}
          alt={productName}
          className="product-card-image"
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}
      <div className="product-card-body">
        <h3>{productName}</h3>
        <p className="product-category">{t(categoryKey)}</p>
        <p className="product-price">
          &euro;{product.price} / {unit}
        </p>
        <p className="product-min-order">{t('products_min_order')}: {product.min_order_quantity} {unit}</p>
        <Link to={`/products/${product.slug}`} className="btn btn-primary">
          {t('products_view')}
        </Link>
      </div>
    </div>
  );
}
