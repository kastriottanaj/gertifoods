// Localised display copy for a product.
//
// The Django catalogue stores one name and one description per product, in
// Albanian and English respectively. Rendering those raw left the German and
// English product pages half-Albanian — invisible while the pages were an empty
// SPA shell, but a real problem now that they are indexed.
//
// So the display strings come from the translation table, keyed by slug, with
// the API value as a fallback. The fallback matters: a product added in the
// Django admin without matching keys must still render its API text rather than
// printing a raw key like `products_name_new_thing` on the page, which is what
// t() returns for a missing key.
export function productCopy(t) {
  const keyFor = (slug) => slug.replaceAll('-', '_');

  // t() echoes the key back when it has no entry; treat that as "not translated".
  const resolve = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  return {
    name: (product) => resolve(`products_name_${keyFor(product.slug)}`, product.name),

    description: (product) =>
      resolve(`products_desc_${keyFor(product.slug)}`, product.description),

    // Only two categories exist; mirror the mapping ProductCard.jsx used.
    category: (product) =>
      t(
        product.category_name === 'Family Pack'
          ? 'products_category_family_pack'
          : 'products_category_pite'
      ),

    unit: (product) =>
      t(product.unit === 'pack' ? 'products_unit_pack' : 'products_unit_piece'),
  };
}
