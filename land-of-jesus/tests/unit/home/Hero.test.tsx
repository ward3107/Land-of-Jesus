import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from '@/components/home/Hero';

vi.mock('@/lib/i18n/navigation', async () => (await import('../helpers/mocks')).navigationModule);
vi.mock('next/image', async () => (await import('../helpers/mocks')).nextImageModule);

const props = {
  image: '/images/hero-jerusalem.jpg',
  headline: 'Discover the living Christian heritage of the Holy Land',
  subheadline: 'Explore churches and communities.',
  primaryCta: { href: '/explore', label: 'Explore the Land' },
  secondaryCta: { href: '/explore?view=map', label: 'Open the Map' },
};

describe('Hero', () => {
  it('renders the page h1, subtitle and both calls to action', () => {
    render(<Hero {...props} />);
    expect(screen.getByRole('heading', { level: 1, name: props.headline })).toBeInTheDocument();
    expect(screen.getByText(props.subheadline)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Explore the Land/ })).toHaveAttribute('href', '/explore');
    expect(screen.getByRole('link', { name: /Open the Map/ })).toHaveAttribute('href', '/explore?view=map');
  });

  it('keeps the photo decorative inside the Ken Burns + scroll-effect wrappers', () => {
    const { container } = render(<Hero {...props} />);
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('src', props.image);
    expect(img.closest('.animate-ken-burns')).not.toBeNull();
    expect(img.closest('.hero-media')).not.toBeNull();
    expect(container.querySelector('.hero-content')).not.toBeNull();
  });
});
