// Countries Gerti Foods serves. Each entry maps a URL slug to the
// translation key for its display name. Per-country detail copy is kept
// generic for now (see AreaDetail) and can be expanded per slug later.
export const areas = [
  { slug: 'kosovo', nameKey: 'area_kosovo' },
  { slug: 'albania', nameKey: 'area_albania' },
  { slug: 'hungary', nameKey: 'area_hungary' },
  { slug: 'croatia', nameKey: 'area_croatia' },
  { slug: 'slovakia', nameKey: 'area_slovakia' },
  { slug: 'germany', nameKey: 'area_germany' },
];

export const getArea = (slug) => areas.find((a) => a.slug === slug);
