// Build-time product catalogue.
//
// The SPA fetched /api/products/ in the browser on every visit, which is why
// /products and every /products/<slug> served an empty shell to crawlers while
// config/sitemaps.py was busy submitting those exact URLs to Google. Reading the
// catalogue here instead bakes it into the HTML at build time and closes that
// hole.
//
// The trade-off, stated plainly: the catalogue is now a build-time snapshot.
// Adding, repricing or retiring a product requires a rebuild
// (`cd frontend && npm run astro:build`) before the change is visible.
//
// The build runs on the same host as Gunicorn (see deploy/DEPLOY.md), so the
// default target is Django directly on the loopback interface — no nginx, no
// TLS, nothing that has to be up yet during a first deploy.
const API_URL = (
  process.env.BUILD_API_URL || 'http://127.0.0.1:8000/api'
).replace(/\/$/, '');

// Escape hatch for working on the site without a database — e.g. editing copy
// on a laptop. Off by default: an unreachable API must fail the build rather
// than silently ship an empty catalogue behind a sitemap full of product URLs.
const ALLOW_EMPTY = process.env.ALLOW_EMPTY_CATALOG === '1';

/**
 * Django returns ImageField URLs absolute, built from the request host — which
 * at build time is 127.0.0.1:8000. Emitting that into production HTML would
 * point every product image at the build machine's loopback address, so keep
 * only the path. nginx already serves /media/ (see deploy/nginx.conf).
 */
function toSiteRelative(url) {
  if (!url) return null;
  try {
    return new URL(url).pathname;
  } catch {
    // Already relative.
    return url.startsWith('/') ? url : `/${url}`;
  }
}

let cache = null;

/**
 * Every available product, following DRF's pagination (PAGE_SIZE is 20, so a
 * catalogue larger than one page would otherwise silently truncate).
 *
 * Memoised because Astro calls this once per route file — the list page and
 * both getStaticPaths — and the catalogue cannot change mid-build.
 */
export async function getProducts() {
  if (cache) return cache;

  const products = [];
  let next = `${API_URL}/products/`;

  try {
    while (next) {
      const res = await fetch(next);
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText} from ${next}`);
      }
      const data = await res.json();
      const page = Array.isArray(data) ? data : (data.results ?? []);
      products.push(...page);
      next = Array.isArray(data) ? null : data.next;
    }
  } catch (err) {
    if (ALLOW_EMPTY) {
      console.warn(
        `\n[products] Could not reach ${API_URL} (${err.message}).\n` +
          `[products] ALLOW_EMPTY_CATALOG=1 is set, so building with an empty catalogue.\n` +
          `[products] /products will render no items and no product pages will exist.\n`
      );
      cache = [];
      return cache;
    }
    throw new Error(
      `Could not load the product catalogue from ${API_URL} (${err.message}).\n\n` +
        `The build needs Django running so product pages can be generated:\n` +
        `  ./venv/bin/python manage.py runserver 127.0.0.1:8000\n\n` +
        `Point the build elsewhere with BUILD_API_URL, or set ALLOW_EMPTY_CATALOG=1\n` +
        `to build without a catalogue (no product pages will be generated).`
    );
  }

  cache = products.map((p) => ({ ...p, image: toSiteRelative(p.image) }));
  return cache;
}

export async function getProduct(slug) {
  return (await getProducts()).find((p) => p.slug === slug);
}
