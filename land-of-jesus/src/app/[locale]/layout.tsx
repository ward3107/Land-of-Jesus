import type { Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, isValidLocale, getDirection } from '@/lib/i18n/config';
import { semantic } from '@/lib/theme/palette';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';

// Edge-to-edge on notched phones (safe-area insets are handled in CSS), with
// the browser UI tinted to the page's linen background.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: semantic.linen,
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

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

  // Enable static rendering for this locale.
  setRequestLocale(locale);

  const messages = await getMessages();
  const dir = getDirection(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <html lang={locale} dir={dir} className="h-full">
        <body className="flex min-h-full flex-col antialiased">
          <AppHeader />
          <main className="flex-1">{children}</main>
          <AppFooter />
        </body>
      </html>
    </NextIntlClientProvider>
  );
}
