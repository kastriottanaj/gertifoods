// Countries Gerti Foods serves. Each entry maps a URL slug to the
// translation key for its display name.
//
// `customers` lists businesses in that market we are allowed to name, with
// the link the page shows. It is data rather than copy because it is the same
// in every language. The per-market supply section (<slug>_supply_* and
// <slug>_faq_* in translations.js) renders only for markets whose facts —
// how it ships, lead time, frequency, minimum order — have been confirmed by
// sales; AreaDetail checks for the keys. A market without them keeps the
// generic page rather than getting invented logistics.
export const areas = [
  {
    slug: 'kosovo',
    nameKey: 'area_kosovo',
    customers: [{ name: 'Interex', url: 'https://interex-rks.com/' }],
  },
  { slug: 'albania', nameKey: 'area_albania' },
  { slug: 'hungary', nameKey: 'area_hungary' },
  { slug: 'croatia', nameKey: 'area_croatia' },
  { slug: 'slovakia', nameKey: 'area_slovakia' },
  { slug: 'germany', nameKey: 'area_germany' },
];

export const getArea = (slug) => areas.find((a) => a.slug === slug);
