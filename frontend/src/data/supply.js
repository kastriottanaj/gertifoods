// Buyer-segment landing pages under /furnizim/<slug>.
//
// Keyword research (Ubersuggest, 2026-09-15) showed that Albanian-language
// demand is not for "byrek wholesale" as a phrase but for the buyer
// categories themselves — byrektore (5,400/mo), furrë buke (3,600/mo) — plus
// the autocomplete queries "furnizim për lokale" and "furnizim për market".
// One page per segment lets each match its category word in URL, title and
// H1 and speak to that buyer's own problem, without competing with /products.
//
// Each entry maps a URL slug to the prefix of its copy in
// src/i18n/translations.js (supply_<slug>_*). The slug is Albanian on every
// language edition (/furnizim/byrektore, /en/furnizim/byrektore), the same
// convention the product pages follow with /de/products/pite-me-djathe.
//
// `products` overrides the product strip for segments whose buyer orders a
// different mix — markets lead with the retail-ready Family Pack, the city and
// regional pages show the whole range. Segments without it get the default
// list in SupplyLanding.astro (the four byrek and the tortilla line).
//
// Keep SUPPLY_SLUGS in config/sitemaps.py in sync with this list.
const FULL_RANGE = [
  '/products/pite-me-djathe',
  '/products/pite-me-spinaq',
  '/products/pite-me-mish',
  '/products/pite-me-tuna',
  '/products/family-pack-pite-4',
  '/products/tortilla',
];

export const supplySegments = [
  { slug: 'byrektore' },
  { slug: 'furra-buke' },
  { slug: 'lokale-restorante' },
  {
    slug: 'markete',
    products: [
      '/products/family-pack-pite-4',
      '/products/pite-me-djathe',
      '/products/pite-me-spinaq',
      '/products/pite-me-mish',
      '/products/pite-me-tuna',
      '/products/tortilla',
    ],
  },
  // City pages: one per capital, carrying that market's confirmed logistics
  // (see <country>_supply_* in translations.js).
  { slug: 'tirane', products: FULL_RANGE },
  { slug: 'prishtine', products: FULL_RANGE },
  // Southern Albania calls this family of pies "lakror" (1,000 searches/mo);
  // the page speaks that vocabulary without claiming a different product.
  { slug: 'lakror', products: FULL_RANGE },
];

export const getSupplySegment = (slug) => supplySegments.find((s) => s.slug === slug);
