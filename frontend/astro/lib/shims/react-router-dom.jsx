// react-router-dom stand-in for the Astro build.
//
// The portal pages (Login, Register, Cart) run as islands, so there is no
// Router above them — useNavigate() and <Link> would throw. Rather than editing
// those shared components, astro.config.mjs aliases 'react-router-dom' to this
// module for the Astro build only. The Vite/SPA build still resolves the real
// package, so nothing about the current site changes.
//
// The semantics are right for a multi-page app: navigation is a page load, and
// a <Link> is an anchor.
import { createElement } from 'react';

const PREFIXED = ['en', 'de'];

// Keep the visitor inside their language edition. On /de/cart, navigate('/orders')
// must land on /de/orders, not bounce them back to Albanian.
function localePrefix() {
  if (typeof window === 'undefined') return '';
  const seg = window.location.pathname.split('/')[1];
  return PREFIXED.includes(seg) ? `/${seg}` : '';
}

function resolve(to) {
  if (typeof to !== 'string' || !to.startsWith('/')) return to;
  const prefix = localePrefix();
  return to === '/' ? prefix || '/' : `${prefix}${to}`;
}

export function Link({ to, children, ...rest }) {
  return createElement('a', { href: resolve(to), ...rest }, children);
}

export const NavLink = Link;

export function useNavigate() {
  return (to, options) => {
    const href = resolve(to);
    if (options?.replace) window.location.replace(href);
    else window.location.assign(href);
  };
}

export function useLocation() {
  if (typeof window === 'undefined') {
    return { pathname: '/', search: '', hash: '', state: null, key: 'default' };
  }
  const { pathname, search, hash } = window.location;
  return { pathname, search, hash, state: null, key: 'default' };
}

// Islands receive their route parameters as props from Astro, so nothing in the
// Astro build reads these — present only so an import cannot fail.
export function useParams() {
  return {};
}

export function useSearchParams() {
  const params = new URLSearchParams(
    typeof window === 'undefined' ? '' : window.location.search
  );
  return [params, () => {}];
}
