import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AccountView } from '@/components/account/AccountView';
import { Container } from '@/components/layout/Container';
import { isValidLocale } from '@/lib/i18n/config';

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations('Navigation');
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return (
    <Container className="py-10 md:py-16">
      <div className="mx-auto max-w-xl">
        <h1 className="font-serif text-4xl font-semibold text-night">{t('account')}</h1>
        <AccountView locale={locale} configured={configured} />
      </div>
    </Container>
  );
}
