import type { Metadata } from 'next';
import { getDirection } from '@communitydirect/core';
import { getActiveLocale } from '@/lib/i18n';
import './globals.css';

export const metadata: Metadata = {
  title: 'CommunityDirect Admin',
  description: 'Own your audience. Communicate directly with your community.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getActiveLocale();
  const dir = getDirection(locale);
  return (
    <html lang={locale} dir={dir}>
      <body>{children}</body>
    </html>
  );
}
