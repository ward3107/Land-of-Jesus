import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { SiteStrip } from '@/components/home/SiteStrip';

vi.mock('@/lib/i18n/navigation', async () => (await import('../helpers/mocks')).navigationModule);
vi.mock('next/image', async () => (await import('../helpers/mocks')).nextImageModule);

const items = [
  { slug: 'basilica-annunciation-nazareth', name: 'Basilica of the Annunciation', city: 'Nazareth', image: '/images/churches/annunciation.jpg' },
  { slug: 'church-nativity-bethlehem', name: 'Church of the Nativity', city: 'Bethlehem', image: null },
];

describe('SiteStrip', () => {
  it('is a focusable, labelled, snap-scrolling region of site links', () => {
    render(
      <SiteStrip
        title="Featured Churches"
        hint="Swipe to see more"
        viewAll={{ href: '/explore', label: 'View All Churches' }}
        items={items}
      />,
    );
    const region = screen.getByRole('region', { name: 'Featured Churches' });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(region.className).toContain('snap-x');
    const links = within(region).getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/churches/basilica-annunciation-nazareth',
      '/churches/church-nativity-bethlehem',
    ]);
    expect(links[0]).toHaveTextContent('Basilica of the Annunciation');
    expect(links[0]).toHaveTextContent('Nazareth');
  });

  it('shows the swipe hint and a view-all link', () => {
    render(
      <SiteStrip
        title="Featured Churches"
        hint="Swipe to see more"
        viewAll={{ href: '/explore', label: 'View All Churches' }}
        items={items}
      />,
    );
    expect(screen.getByText('Swipe to see more')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View All Churches' })).toHaveAttribute('href', '/explore');
  });
});
