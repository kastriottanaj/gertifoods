// schema.org JSON-LD graph, copied verbatim from frontend/index.html.
//
// It lives in a module rather than inline in the layout because inside an
// .astro template a bare `{` would need escaping. Emitting it via
// JSON.stringify() produces the same graph, just minified.

const ORIGIN = 'https://gertifoods.com';
const ORGANIZATION_ID = `${ORIGIN}/#organization`;

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://gertifoods.com/#organization',
      name: 'Gerti Foods',
      url: 'https://gertifoods.com/',
      logo: 'https://gertifoods.com/favicon-512.png',
      image: 'https://gertifoods.com/favicon-512.png',
      email: 'info@gertifoods.com',
      telephone: '+383 49 111 150',
      foundingDate: '2024-01',
      description:
        'Gerti Foods supplies bakeries, hotels, restaurants and supermarkets with ISO 22000 certified half-baked products.',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Str. Kalaja e Shkupit',
        addressLocality: 'Prizren',
        postalCode: '20000',
        addressCountry: 'XK',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+383 49 111 150',
        email: 'info@gertifoods.com',
        contactType: 'sales',
        availableLanguage: ['sq', 'en', 'de'],
      },
    },
    {
      '@type': 'LocalBusiness',
      '@id': 'https://gertifoods.com/#localbusiness',
      name: 'Gerti Foods',
      url: 'https://gertifoods.com/',
      image: 'https://gertifoods.com/favicon-512.png',
      telephone: '+383 49 111 150',
      email: 'info@gertifoods.com',
      priceRange: '$$',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Str. Kalaja e Shkupit',
        addressLocality: 'Prizren',
        postalCode: '20000',
        addressCountry: 'XK',
      },
      parentOrganization: { '@id': 'https://gertifoods.com/#organization' },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://gertifoods.com/#website',
      url: 'https://gertifoods.com/',
      name: 'Gerti Foods',
      inLanguage: ['sq', 'en', 'de'],
      publisher: { '@id': 'https://gertifoods.com/#organization' },
    },
    {
      '@type': 'Service',
      name: 'Half-baked product supply',
      serviceType: 'Wholesale supply of half-baked bakery products',
      description:
        'Wholesale supply of ISO 22000 certified half-baked products — byrek (pies) and tortillas — for bakeries, hotels, restaurants and supermarkets.',
      provider: { '@id': 'https://gertifoods.com/#organization' },
      areaServed: {
        '@type': 'Country',
        name: 'Kosovo',
      },
    },
  ],
};

/**
 * Product JSON-LD for a /products/<slug> page.
 *
 * Every string here comes from the same localised copy the page renders, not
 * from the raw API fields — structured data that disagrees with the visible
 * text is a policy violation, not just a wasted opportunity.
 *
 * @param {object}  args
 * @param {object}  args.product     Raw product from the Django catalogue.
 * @param {string}  args.name        Localised name, as rendered in the <h1>.
 * @param {string}  args.description Localised description, as rendered.
 * @param {string}  args.category    Localised category badge text.
 * @param {string}  args.unit        Localised unit ("copë" / "piece" / "Stück").
 * @param {string}  args.canonical   Absolute URL of this language edition.
 * @param {boolean} args.showsPrice  Whether the page actually prints the price.
 */
export function productSchema({
  product,
  name,
  description,
  category,
  unit,
  canonical,
  showsPrice,
}) {
  const schema = {
    '@type': 'Product',
    '@id': `${canonical}#product`,
    name,
    description,
    category,
    // The slug is the catalogue's only stable public identifier; Django has no
    // separate SKU field.
    sku: product.slug,
    brand: { '@type': 'Brand', name: 'Gerti Foods' },
    manufacturer: { '@id': ORGANIZATION_ID },
  };

  // Django serves ImageField URLs site-relative here (see lib/products.js);
  // schema.org needs them absolute. Omitted entirely when the product has no
  // image — a missing property costs a rich result, a broken one costs trust.
  if (product.image) {
    schema.image = new URL(product.image, ORIGIN).href;
  }

  // The Family Pack page is a request-an-offer page with no price on it. An
  // Offer carrying a price the visitor cannot see is exactly the mismatch
  // Google issues manual actions for, so that page gets the Product entity
  // without an Offer rather than an invented one.
  if (showsPrice) {
    schema.offers = {
      '@type': 'Offer',
      url: canonical,
      price: String(product.price),
      priceCurrency: 'EUR',
      availability: product.is_available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': ORGANIZATION_ID },
      businessFunction: 'http://purl.org/goodrelations/v1#Sell',
      // The page prints "€X / unit", so say per what. Without the reference
      // quantity, `price` alone reads as the price of the whole product.
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: String(product.price),
        priceCurrency: 'EUR',
        referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitText: unit },
      },
      // Minimum order quantity. `minValue` rather than `value`: eligibleQuantity
      // describes the interval of order sizes the offer is valid for, and this
      // is its lower bound, not a fixed amount.
      eligibleQuantity: {
        '@type': 'QuantitativeValue',
        minValue: product.min_order_quantity,
        unitText: unit,
      },
    };
  }

  return schema;
}

/**
 * BreadcrumbList for a product page: Home > Products > <product>.
 *
 * `items` is an array of { name, url }, deepest last. The final entry drops
 * `item` per Google's guidance — it is the page being viewed, so pointing it
 * at itself adds nothing.
 */
export function breadcrumbSchema(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map(({ name, url }, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
      ...(index === items.length - 1 ? {} : { item: url }),
    })),
  };
}

/**
 * Serialise a schema.org graph for injection into a <script> tag.
 *
 * The escaping is the whole point. `JSON.stringify` does not escape `<`, so a
 * value containing `</script>` closes the tag early and everything after it is
 * parsed as markup — the classic JSON-in-HTML injection. Product names and
 * descriptions reach productSchema() from the Django API, which means they are
 * whatever staff typed into the admin; blog copy comes from a repo file today
 * but has no guarantee of staying there.
 *
 * `<` is a valid JSON escape for `<` and parses back to the same string,
 * so this changes nothing about the data — only about how it survives the HTML
 * parser on the way in.
 *
 * BaseLayout.astro already did exactly this inline for the exit-popup strings;
 * the three JSON-LD blocks did not. Having one function means the next block
 * cannot quietly omit it.
 */
export function jsonLd(graph) {
  return JSON.stringify(graph).replace(/</g, '\\u003c');
}
