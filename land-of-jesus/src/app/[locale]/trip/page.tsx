import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { TripPlanner, type TripPlace } from '@/components/trips/TripPlanner';
import { getChurches } from '@/lib/data/churches';
import { isValidLocale } from '@/lib/i18n/config';

export default async function TripPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations('Trip');
  const places: TripPlace[] = (await getChurches(locale))
    .filter((church) => Number.isFinite(church.location.latitude) && Number.isFinite(church.location.longitude) && church.location.latitude !== 0 && church.location.longitude !== 0)
    .map((church) => ({
      slug: church.slug,
      name: church.name,
      city: church.location.city,
      latitude: church.location.latitude,
      longitude: church.location.longitude,
    }));
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return <Container className="py-10 md:py-16">
    <div className="mb-8 max-w-3xl">
      <h1 className="font-serif text-4xl font-semibold text-night">{t('title')}</h1>
      <p className="mt-3 leading-relaxed text-muted">{t('subtitle')}</p>
    </div>
    <TripPlanner places={places} locale={locale} configured={configured} />
  </Container>;
}
