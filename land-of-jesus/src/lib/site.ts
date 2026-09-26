/**
 * The canonical absolute origin of the site, used for canonical URLs, the
 * sitemap, robots and Open Graph tags. Set NEXT_PUBLIC_APP_URL to your final
 * domain in the environment; otherwise we fall back to Vercel's production URL,
 * then to the current deployment URL.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (prod) return `https://${prod}`;
  return 'https://land-of-jesus.vercel.app';
}

export const SITE_URL = resolveSiteUrl();

/** Brand name, kept out of translations for use in structured data / OG. */
export const SITE_NAME = 'Land of Jesus';
