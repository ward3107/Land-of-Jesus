import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { renderWithIntl } from '../helpers/intl';
import { BackToTop, shouldShowBackToTop } from '@/components/layout/BackToTop';

describe('shouldShowBackToTop', () => {
  it('appears only after 80% of the first screen', () => {
    expect(shouldShowBackToTop(0, 800)).toBe(false);
    expect(shouldShowBackToTop(640, 800)).toBe(false);
    expect(shouldShowBackToTop(641, 800)).toBe(true);
  });
});

describe('BackToTop', () => {
  beforeEach(() => {
    // Async frame so the rAF throttle behaves like a browser.
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      queueMicrotask(() => cb(0));
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true, configurable: true });
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  });
  afterEach(() => vi.unstubAllGlobals());

  // window.scrollY is read-only in lib.dom, so redefine it (tsc checks tests too).
  const scrollTo = async (y: number) => {
    Object.defineProperty(window, 'scrollY', { value: y, writable: true, configurable: true });
    await act(async () => {
      fireEvent.scroll(window);
    });
  };

  it('is hidden and inert at the top of the page', async () => {
    renderWithIntl(<BackToTop />);
    await act(async () => {});
    const button = screen.getByRole('button', { name: 'Back to top', hidden: true });
    expect(button).toHaveAttribute('inert');
    expect(button).toHaveAttribute('data-visible', 'false');
  });

  it('appears after scrolling down and hides again at the top', async () => {
    renderWithIntl(<BackToTop />);
    await scrollTo(700);
    const button = screen.getByRole('button', { name: 'Back to top' });
    expect(button).not.toHaveAttribute('inert');
    expect(button).toHaveAttribute('data-visible', 'true');
    await scrollTo(0);
    expect(button).toHaveAttribute('data-visible', 'false');
  });

  it('scrolls smoothly to the top and moves focus to the main content', async () => {
    const main = document.createElement('main');
    main.id = 'main';
    main.tabIndex = -1;
    document.body.appendChild(main);

    renderWithIntl(<BackToTop />);
    await scrollTo(2000);
    fireEvent.click(screen.getByRole('button', { name: 'Back to top' }));

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(main).toHaveFocus();
    main.remove();
  });

  it('jumps without animation when reduced motion is preferred', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce'), media: query }));
    renderWithIntl(<BackToTop />);
    await scrollTo(2000);
    fireEvent.click(screen.getByRole('button', { name: 'Back to top' }));
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });
});
