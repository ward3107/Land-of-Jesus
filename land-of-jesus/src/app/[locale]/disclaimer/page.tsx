import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/lib/i18n/config';
import { LegalDocument } from '@/components/legal/LegalDocument';

const LAST_UPDATED = '2026-09-26';
const CONTACT_EMAIL = 'wasya92@gmail.com';

const SECTIONS = [
  ['generalTitle', 'generalBody'],
  ['accuracyTitle', 'accuracyBody'],
  ['religiousTitle', 'religiousBody'],
  ['imageryTitle', 'imageryBody'],
  ['translationTitle', 'translationBody'],
  ['externalTitle', 'externalBody'],
  ['travelTitle', 'travelBody'],
] as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'Disclaimer' });
  return { title: t('title') };
}

export default async function DisclaimerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);
  return (
    <LegalDocument locale={locale} namespace="Disclaimer" sections={SECTIONS} lastUpdated={LAST_UPDATED} email={CONTACT_EMAIL} />
  );
}
