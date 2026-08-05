// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { fileURLToPath } from 'node:url';

// Astro is now the site build. `npm run build` runs it, and it writes the same
// dist/ directory nginx has always served, so deploy/nginx.conf keeps its root.
// The React components that remain (the lead forms, the modal, the portal
// pages) are imported from src/ and hydrated as islands.
export default defineConfig({
  site: 'https://gertifoods.com',

  // The default srcDir ('./src') can't be used: src/pages/*.jsx still holds the
  // React page components that run as islands, and Astro would try to build
  // them as routes. Astro therefore keeps its own source tree and imports
  // across into src/ for shared code.
  srcDir: './astro',

  // The directory deploy/nginx.conf serves.
  outDir: './dist',

  // Shared with the Vite build — favicons, robots.txt, llms.txt, hero.webp.
  publicDir: './public',

  build: {
    // 'file' emits /imprint.html rather than the default /imprint/index.html.
    // Directory output would make nginx 301-redirect /imprint -> /imprint/,
    // which deploy/nginx.conf deliberately avoids so no canonical URL points
    // at a redirect. This keeps `try_files $uri $uri.html /index.html` working
    // against the Astro output exactly as it does against prerender.js output.
    format: 'file',
  },

  integrations: [react()],

  vite: {
    resolve: {
      alias: {
        // The React components reused as islands (the portal pages and the
        // shared SEO component) import react-router-dom and react-helmet-async,
        // neither of which has a provider above an island — both would throw.
        //
        // Aliasing them to multi-page-app equivalents means those components
        // are reused verbatim instead of forked. This applies to the Astro
        // build ONLY; `npm run build` still resolves the real packages, so the
        // live SPA is unaffected.
        'react-router-dom': fileURLToPath(
          new URL('./astro/lib/shims/react-router-dom.jsx', import.meta.url)
        ),
        'react-helmet-async': fileURLToPath(
          new URL('./astro/lib/shims/react-helmet-async.jsx', import.meta.url)
        ),
      },
    },
  },
});
