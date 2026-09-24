'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { Container } from './Container';

export function AppFooter() {
  const tf = useTranslations('Footer');
  const tn = useTranslations('Navigation');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      <Container className="flex flex-col gap-6 py-12 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-serif text-lg text-stone-900">Land of Jesus</p>
          <p className="mt-1 text-sm text-stone-600">{tf('tagline')}</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/explore" className="text-sm text-stone-600 hover:text-stone-900">
            {tn('explore')}
          </Link>
          <Link href="/projects" className="text-sm text-stone-600 hover:text-stone-900">
            {tn('projects')}
          </Link>
          <Link href="/stories" className="text-sm text-stone-600 hover:text-stone-900">
            {tn('stories')}
          </Link>
          <Link href="/visit" className="text-sm text-stone-600 hover:text-stone-900">
            {tn('visit')}
          </Link>
        </nav>
        <p className="text-sm text-stone-500">{tf('copyright', { year })}</p>
      </Container>
    </footer>
  );
}
