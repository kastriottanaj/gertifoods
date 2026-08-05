// react-helmet-async stand-in for the Astro build.
//
// Every page's <title>, description, canonical and og tags are now emitted by
// BaseLayout.astro at build time. The SEO component inside the ported React
// pages would try to manage the same tags at runtime — and without a
// HelmetProvider above the island it would simply throw.
//
// Rendering nothing is the correct behaviour here: the head is already right
// before any JavaScript runs, which is the whole point of the migration.
export function Helmet() {
  return null;
}

export function HelmetProvider({ children }) {
  return children;
}

export default Helmet;
