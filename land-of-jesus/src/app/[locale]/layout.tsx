import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, isValidLocale, getDirection } from '@/lib/i18n/config';

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

  // Enable static rendering for this locale
  setRequestLocale(locale);

  // Get messages for the current locale
  const messages = await getMessages();
  const dir = getDirection(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <html lang={locale} dir={dir} className="h-full">
        <body className="min-h-full flex flex-col bg-white text-stone-900 antialiased">
          {children}
        </body>
      </html>
    </NextIntlClientProvider>
  );
}
