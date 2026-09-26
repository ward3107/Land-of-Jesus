import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/lib/i18n/config';
import { LegalDocument } from '@/components/legal/LegalDocument';

const LAST_UPDATED = '2026-09-26';
const SITE = 'landofjesus.net';
const CONTROLLER_NAME = 'Waseem';
const CONTACT_EMAIL = 'wasya92@gmail.com';

const SECTIONS = [
  ['controllerTitle', 'controllerBody'],
  ['collectTitle', 'collectBody'],
  ['noTrackingTitle', 'noTrackingBody'],
  ['cookiesTitle', 'cookiesBody'],
  ['thirdPartyTitle', 'thirdPartyBody'],
  ['transfersTitle', 'transfersBody'],
  ['retentionTitle', 'retentionBody'],
  ['legalBasisTitle', 'legalBasisBody'],
  ['rightsTitle', 'rightsBody'],
  ['complaintsTitle', 'complaintsBody'],
  ['childrenTitle', 'childrenBody'],
  ['securityTitle', 'securityBody'],
  ['changesTitle', 'changesBody'],
] as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'Privacy' });
  return { title: t('title') };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);
  return (
    <LegalDocument
      locale={locale}
      namespace="Privacy"
      sections={SECTIONS}
      lastUpdated={LAST_UPDATED}
      email={CONTACT_EMAIL}
      values={{ site: SITE, name: CONTROLLER_NAME }}
    />
  );
}
