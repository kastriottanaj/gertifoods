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
// `supplyPages` lists the /furnizim/<slug> landing pages (src/data/supply.js)
// the country page links to. Only the two Albanian-speaking markets have them
// today: the segment pages address buyers in Kosovo and Albania, and each
// capital has a city page.
export const areas = [
  {
    slug: 'kosovo',
    nameKey: 'area_kosovo',
    customers: [{ name: 'Interex', url: 'https://interex-rks.com/' }],
    supplyPages: ['byrektore', 'furra-buke', 'lokale-restorante', 'markete', 'prishtine'],
  },
  {
    slug: 'albania',
    nameKey: 'area_albania',
    supplyPages: ['byrektore', 'furra-buke', 'lokale-restorante', 'markete', 'tirane', 'lakror'],
  },
  { slug: 'hungary', nameKey: 'area_hungary' },
  { slug: 'croatia', nameKey: 'area_croatia' },
  { slug: 'slovakia', nameKey: 'area_slovakia' },
  { slug: 'germany', nameKey: 'area_germany' },
];

export const getArea = (slug) => areas.find((a) => a.slug === slug);
