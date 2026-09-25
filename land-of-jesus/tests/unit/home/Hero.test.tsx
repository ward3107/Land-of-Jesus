import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { Hero } from '@/components/home/Hero';

vi.mock('@/lib/i18n/navigation', async () => (await import('../helpers/mocks')).navigationModule);
vi.mock('next/image', async () => (await import('../helpers/mocks')).nextImageModule);

const chapters = [
  { image: '/images/churches/annunciation.jpg', city: 'Nazareth', line: 'Where the message began' },
  { image: '/images/churches/nativity.jpg', city: 'Bethlehem', line: 'Where he was born' },
  { image: '/images/churches/holy-sepulchre.jpg', city: 'Jerusalem', line: 'Where the story turns to hope' },
];

const props = {
  chapters,
  scrollHint: 'Scroll to begin',
  progressLabel: 'Journey progress',
  primaryCta: { href: '/explore', label: 'Explore the Land' },
  secondaryCta: { href: '/explore?view=map', label: 'Open the Map' },
};

const allowMotion = () =>
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }));

/** Simulate the pinned section being scrolled by `viewports` screens. */
async function scrollInto(viewports: number) {
  const section = screen.getByRole('region', { name: 'Journey progress' });
  vi.spyOn(section, 'getBoundingClientRect').mockReturnValue({
    top: -viewports * window.innerHeight,
    left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}),
  } as DOMRect);
  await act(async () => {
    fireEvent.scroll(window);
  });
}

const activeCity = () => {
  const nav = screen.getByRole('navigation', { name: 'Journey progress' });
  const li = within(nav).getAllByRole('listitem').find((item) => item.querySelector('[aria-current="step"]'));
  return li ? within(li).getByText(/\w/).textContent : null;
};

describe('Hero (storytelling journey)', () => {
  beforeEach(() => {
    // Run the rAF-throttled scroll handler synchronously so scrollInto() is instant.
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { queueMicrotask(() => cb(0)); return 1; });
    vi.stubGlobal('cancelAnimationFrame', () => {});
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true, configurable: true });
    allowMotion();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('renders every chapter line and city, and the first line as the h1', () => {
    render(<Hero {...props} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Where the message began');
    for (const c of chapters) {
      expect(screen.getByText(c.line)).toBeInTheDocument();
      expect(screen.getAllByText(c.city).length).toBeGreaterThan(0);
    }
  });

  it('keeps the photos decorative', () => {
    const { container } = render(<Hero {...props} />);
    const imgs = [...container.querySelectorAll('img')];
    expect(imgs).toHaveLength(3);
    for (const img of imgs) expect(img).toHaveAttribute('alt', '');
  });

  it('reveals both CTAs at the final chapter', async () => {
    render(<Hero {...props} />);
    await scrollInto(2);
    expect(screen.getByRole('link', { name: /Explore the Land/ })).toHaveAttribute('href', '/explore');
    expect(screen.getByRole('link', { name: /Open the Map/ })).toHaveAttribute('href', '/explore?view=map');
  });

  describe('enhanced (motion allowed)', () => {
    it('shows a labelled progress stepper with one item per chapter, first active', async () => {
      render(<Hero {...props} />);
      await scrollInto(0);
      const nav = screen.getByRole('navigation', { name: 'Journey progress' });
      expect(within(nav).getAllByRole('listitem')).toHaveLength(3);
      expect(nav).toHaveTextContent('Nazareth');
      expect(activeCity()).toBe('Nazareth');
    });

    it('advances the active chapter one full screen at a time', async () => {
      render(<Hero {...props} />);
      await scrollInto(0);
      expect(activeCity()).toBe('Nazareth');
      await scrollInto(1);
      expect(activeCity()).toBe('Bethlehem');
      expect(screen.getByRole('status')).toHaveTextContent('Bethlehem');
      await scrollInto(2);
      expect(activeCity()).toBe('Jerusalem');
      // Never past the last chapter, however far you scroll.
      await scrollInto(9);
      expect(activeCity()).toBe('Jerusalem');
      expect(screen.getByRole('status')).toHaveTextContent('Jerusalem');
    });
  });

  describe('reduced motion / no-JS (static baseline)', () => {
    it('shows the whole story as plain panels with no stepper', () => {
      vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }));
      render(<Hero {...props} />);
      expect(screen.queryByRole('navigation', { name: 'Journey progress' })).not.toBeInTheDocument();
      for (const c of chapters) expect(screen.getByText(c.line)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Explore the Land/ })).toBeInTheDocument();
    });
  });
});
