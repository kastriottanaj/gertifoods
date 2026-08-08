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

    // SERP copy, deliberately separate from the two above. The page used to put
    // the product name in <title> and the first 160 characters of the body
    // description in the meta description, which produced titles like
    // 'Byrek me Djathë | Gerti Foods' — no audience, no proposition — and
    // descriptions that ended mid-word. These are hand-written per product.
    //
    // Null rather than a fallback when unset, so the caller can tell an
    // authored title from a missing one. A product added in the Django admin
    // without matching keys has to fall back to the display copy — printing a
    // raw key like `products_seo_title_new_thing` into <head> would be worse
    // than a plain title — and it also needs the ' | Gerti Foods' suffix that
    // authored titles suppress. Only the caller knows how to do both.
    seoTitle: (product) => resolve(`products_seo_title_${keyFor(product.slug)}`, null),

    seoDescription: (product) => resolve(`products_meta_${keyFor(product.slug)}`, null),

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
