// schema.org JSON-LD graph, copied verbatim from frontend/index.html.
//
// It lives in a module rather than inline in the layout because inside an
// .astro template a bare `{` would need escaping. Emitting it via
// JSON.stringify() produces the same graph, just minified.
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
