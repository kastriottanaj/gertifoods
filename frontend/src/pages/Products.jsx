import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../i18n/LanguageContext';
import SEO from '../components/SEO';

export default function Products() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  // Seed the search box from the URL (?search=) so the declarative WebMCP form
  // and shared/deep-linked search URLs land on real results.
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/categories/').then((res) => setCategories(res.data.results || res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    api.get('/products/', { params })
      .then((res) => setProducts(res.data.results || res.data))
      .finally(() => setLoading(false));
  }, [search]);

  const filtered = selectedCategory
    ? products.filter((p) => p.category === parseInt(selectedCategory))
    : products;

  return (
    <div className="products-page">
      <SEO title={t('products_title')} description={t('products_meta')} />
      <h1>{t('products_title')}</h1>
      <div className="products-filters">
        <input
          type="text"
          placeholder={t('products_search')}
          value={search}
          onChange={(e) => {
            const value = e.target.value;
            setSearch(value);
            setSearchParams(value ? { search: value } : {}, { replace: true });
          }}
          className="search-input"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-select"
        >
          <option value="">{t('products_all_categories')}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <p className="loading">{t('products_loading')}</p>
      ) : (
        <div className="products-grid">
          {filtered.map((product, i) => (
            // The grid is at most four columns wide, so the first four cards
            // are the ones that can land above the fold.
            <ProductCard key={product.id} product={product} priority={i < 4} />
          ))}
          {filtered.length === 0 && <p>{t('products_empty')}</p>}
        </div>
      )}
    </div>
  );
}
