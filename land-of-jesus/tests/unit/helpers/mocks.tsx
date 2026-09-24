import { vi } from 'vitest';
import type { AnchorHTMLAttributes } from 'react';

/**
 * Shared test doubles. In a test file:
 *   vi.mock('@/lib/i18n/navigation', async () => (await import('../helpers/mocks')).navigationModule);
 *   vi.mock('next/image', async () => (await import('../helpers/mocks')).nextImageModule);
 * then set `navState.pathname` (locale-less, e.g. '/explore') per test.
 */
export const navState = { pathname: '/', replace: vi.fn() };

export const navigationModule = {
  Link: ({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  usePathname: () => navState.pathname,
  useRouter: () => ({ replace: navState.replace }),
};

export const nextImageModule = {
  default: ({ src, alt, className }: { src: string; alt: string; className?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  ),
};
