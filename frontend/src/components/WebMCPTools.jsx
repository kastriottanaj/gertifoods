import { useEffect } from 'react';

// WebMCP tool registration + a declarative WebMCP search form.
// See https://developer.chrome.com/docs/ai/webmcp. Tools let an agentic
// browser act on this site (search the catalog, fetch contact details);
// the hidden <form> satisfies the Lighthouse webmcp-schema-validity audit.
//
// Tools are registered once per page load. React StrictMode double-invokes
// effects in dev, so a module-level guard prevents duplicate registration.
let registered = false;

// Same-origin in production: Nginx proxies /api to Gunicorn. We hit the
// existing DRF product search endpoint rather than inventing a new one.
const API = '/api';

const CONTACT = [
  'Gerti Foods, Prizren, Kosovo',
  'Phone: +383 49 111 150',
  'WhatsApp: https://wa.me/38349111150',
  'Email: info@gertifoods.com (sales: arlinda@gertifoods.com)',
  'Address: Str. Kalaja e Shkupit, Prizren 20000, Kosovo',
  'Languages: Albanian, English, German',
].join('\n');

export default function WebMCPTools() {
  useEffect(() => {
    if (registered) return;
    if (typeof navigator === 'undefined' || !navigator.modelContext) return;
    registered = true;

    navigator.modelContext.registerTool({
      name: 'search_products',
      description:
        'Search the Gerti Foods product catalog by keyword and return up to ten matching half-baked products with name, page URL, price and a short description.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Keyword or phrase, plain text (for example "byrek" or "tortilla").',
          },
          limit: {
            type: 'integer',
            description: 'Maximum number of results, default 5, max 10.',
            default: 5,
          },
        },
        required: ['query'],
      },
      annotations: { readOnlyHint: true },
      execute: async function (input) {
        const q = String((input && input.query) || '').trim();
        if (!q) return 'No query provided.';
        const limit = Math.min(parseInt(input && input.limit, 10) || 5, 10);
        try {
          const res = await fetch(
            API + '/products/?search=' + encodeURIComponent(q),
          );
          if (!res.ok) return 'Search failed with status ' + res.status;
          const data = await res.json();
          const items = (data && data.results) || data || [];
          if (!items.length) return 'No products found for "' + q + '".';
          return items
            .slice(0, limit)
            .map(function (p) {
              const url = 'https://gertifoods.com/products/' + p.slug;
              const price =
                p.price != null ? ' (' + p.price + ' EUR/' + (p.unit || 'unit') + ')' : '';
              const excerpt = p.description ? ' - ' + p.description : '';
              return '- ' + p.name + price + ': ' + url + excerpt;
            })
            .join('\n');
        } catch (e) {
          return 'Search error: ' + e.message;
        }
      },
    });

    navigator.modelContext.registerTool({
      name: 'get_contact_info',
      description:
        'Return the Gerti Foods sales contact details (phone, WhatsApp, email and address) so a buyer can reach the company.',
      inputSchema: { type: 'object', properties: {} },
      annotations: { readOnlyHint: true },
      execute: async function () {
        return CONTACT;
      },
    });
  }, []);

  // Declarative WebMCP form. Visually hidden, fully functional: a GET to
  // /products?search=... loads the catalog with that query applied.
  return (
    <form
      toolname="search_products_form"
      tooldescription="Search the Gerti Foods catalog by keyword and load the product results page."
      action="/products"
      method="get"
      className="webmcp-search-form"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
    >
      <label htmlFor="webmcp-q">Search products</label>
      <input
        id="webmcp-q"
        type="search"
        name="search"
        toolparamdescription="The keyword or phrase to search the product catalog for. Plain text."
        autoComplete="off"
      />
      <button type="submit">Search</button>
    </form>
  );
}
