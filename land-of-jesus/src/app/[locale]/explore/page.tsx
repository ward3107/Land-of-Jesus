import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/lib/i18n/config';
import { getChurches } from '@/lib/data/churches';
import { ExploreView, type ExploreChurch } from './ExploreView';

export default async function ExplorePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);

  const { view } = await searchParams;

  // Live Supabase content (falls back to bundled demo data on error/empty).
  const churches: ExploreChurch[] = (await getChurches(locale)).map((c) => ({
    slug: c.slug,
    name: c.name,
    location: c.location.city,
    tradition: c.tradition,
    isOpen: c.visitingInfo.isOpen === true,
    hasProjects: c.hasProjects,
    image: c.image,
    latitude: c.location.latitude,
    longitude: c.location.longitude,
  }));

  return <ExploreView initialView={view === 'map' ? 'map' : 'list'} churches={churches} />;
}
