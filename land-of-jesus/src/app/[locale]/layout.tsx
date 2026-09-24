import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { EB_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import { locales, isValidLocale, getDirection } from '@/lib/i18n/config';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';

// UI/body sans + editorial serif. The CSS variables are consumed by the
// Tailwind theme (--font-sans / --font-serif) in globals.css.
const sans = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

const serif = EB_Garamond({
  variable: '--font-garamond',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

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
      <html lang={locale} dir={dir} className={`h-full ${sans.variable} ${serif.variable}`}>
        <body className="flex min-h-full flex-col bg-white font-sans text-stone-900 antialiased">
          <AppHeader />
          <main className="flex-1">{children}</main>
          <AppFooter />
        </body>
      </html>
    </NextIntlClientProvider>
  );
}
