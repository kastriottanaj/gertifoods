import { Link } from 'react-router-dom';

// `priority` marks the cards the grid puts in its first row: those can be the
// LCP element, so they load eagerly. Everything further down the grid is
// lazy-loaded. The card image box is fixed by CSS (.product-card-image), so no
// intrinsic width/height attribute is needed to keep the layout stable.
export default function ProductCard({ product, priority = false }) {
  return (
    <div className="product-card">
      {product.image && (
        <img
          src={product.image}
          alt={product.name}
          className="product-card-image"
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}
      <div className="product-card-body">
        <h3>{product.name}</h3>
        <p className="product-category">{product.category_name}</p>
        <p className="product-price">
          &euro;{product.price} / {product.unit}
        </p>
        <p className="product-min-order">Min. order: {product.min_order_quantity} {product.unit}</p>
        <Link to={`/products/${product.slug}`} className="btn btn-primary">
          View Details
        </Link>
      </div>
    </div>
  );
}
