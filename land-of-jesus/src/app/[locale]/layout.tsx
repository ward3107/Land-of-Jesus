import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { locales, isValidLocale } from '@/lib/i18n/config';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <html lang={locale} dir={locale === 'ar' || locale === 'he' ? 'rtl' : 'ltr'}>
      <body className="min-h-screen bg-white text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
