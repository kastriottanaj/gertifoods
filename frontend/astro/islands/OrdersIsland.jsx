import withProviders from './withProviders.jsx';
import Orders from '../../src/pages/Orders';

// src/pages/Orders.jsx reused unchanged. react-router-dom and react-helmet-async
// resolve to the multi-page shims (see astro.config.mjs), so navigation is a
// real page load and the redundant <SEO> renders nothing.
export default withProviders(Orders);
