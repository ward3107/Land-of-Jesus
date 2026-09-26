'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { Container } from './Container';

const LINKS = [
  { href: '/explore', key: 'explore' },
  { href: '/projects', key: 'projects' },
  { href: '/stories', key: 'stories' },
  { href: '/visit', key: 'visit' },
] as const;

export function AppFooter() {
  const tf = useTranslations('Footer');
  const tn = useTranslations('Navigation');
  const ta = useTranslations('Accessibility');
  const tp = useTranslations('Privacy');
  const tc = useTranslations('Cookie');
  const tt = useTranslations('Terms');
  const td = useTranslations('Disclaimer');
  const year = new Date().getFullYear();

  // Legal / compliance links. Accessibility is required in the footer by IS 5568.
  const legal = [
    { href: '/accessibility', label: ta('footerLabel') },
    { href: '/privacy', label: tp('footerLabel') },
    { href: '/cookies', label: tc('footerLabel') },
    { href: '/terms', label: tt('footerLabel') },
    { href: '/disclaimer', label: td('footerLabel') },
  ];

  return (
    <footer className="border-t border-hairline bg-linen">
      <Container className="py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-serif text-lg font-semibold text-night">Land of Jesus</p>
            <p className="mt-1 text-sm text-muted">{tf('tagline')}</p>
          </div>
          <nav aria-label={tn('footerNav')} className="flex flex-wrap gap-x-6 gap-y-3">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm text-muted transition-colors hover:text-night">
                {tn(l.key)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-hairline/70 pt-6 md:flex-row md:items-center md:justify-between">
          <nav aria-label={tn('footerNav')} className="flex flex-wrap gap-x-5 gap-y-2">
            {legal.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm text-muted transition-colors hover:text-night">
                {l.label}
              </Link>
            ))}
          </nav>
          <p className="text-sm text-muted">{tf('copyright', { year })}</p>
        </div>
      </Container>
    </footer>
  );
}
