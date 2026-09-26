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
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-hairline bg-linen">
      <Container className="flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
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
          {/* Required by IS 5568: an accessibility-statement link in the footer. */}
          <Link href="/accessibility" className="text-sm text-muted transition-colors hover:text-night">
            {ta('footerLabel')}
          </Link>
        </nav>
        <p className="text-sm text-muted">{tf('copyright', { year })}</p>
      </Container>
    </footer>
  );
}
