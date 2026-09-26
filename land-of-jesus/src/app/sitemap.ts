import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { locales, defaultLocale } from '@/lib/i18n/config';
import { getChurches } from '@/lib/data/churches';
import { getProjects } from '@/lib/data/projects';

// Pages that exist for every locale (paths relative to the locale prefix).
const STATIC_PATHS = [
  '',
  'explore',
  'projects',
  'stories',
  'visit',
  'accessibility',
  'privacy',
  'cookies',
  'terms',
  'disclaimer',
];

/** One sitemap entry per page, listing every locale as an hreflang alternate. */
function entry(path: string): MetadataRoute.Sitemap[number] {
  const suffix = path ? `/${path}` : '';
  const languages: Record<string, string> = { 'x-default': `${SITE_URL}/${defaultLocale}${suffix}` };
  for (const l of locales) languages[l] = `${SITE_URL}/${l}${suffix}`;
  return {
    url: `${SITE_URL}/${defaultLocale}${suffix}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : 0.7,
    alternates: { languages },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Real church/project slugs so detail pages are indexed too (falls back to
  // the bundled demo data if Supabase is unavailable at build time).
  const [churches, projects] = await Promise.all([
    getChurches(defaultLocale).catch(() => []),
    getProjects(defaultLocale).catch(() => []),
  ]);

  const paths = [
    ...STATIC_PATHS,
    ...churches.map((c) => `churches/${c.slug}`),
    ...projects.map((p) => `projects/${p.slug}`),
  ];

  return paths.map(entry);
}
