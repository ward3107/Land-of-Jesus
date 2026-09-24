import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { Reveal } from '@/components/motion/Reveal';

class MockIO {
  static instances: MockIO[] = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
  constructor(
    public callback: IntersectionObserverCallback,
    public options?: IntersectionObserverInit,
  ) {
    MockIO.instances.push(this);
  }
  trigger(isIntersecting: boolean) {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

const wrapperOf = (text: string) => screen.getByText(text).parentElement as HTMLElement;

describe('Reveal', () => {
  beforeEach(() => {
    MockIO.instances = [];
    vi.stubGlobal('IntersectionObserver', MockIO);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('starts hidden and reveals once, the first time it intersects', () => {
    render(
      <Reveal>
        <p>Hello</p>
      </Reveal>,
    );
    const el = wrapperOf('Hello');
    expect(el).toHaveAttribute('data-reveal');
    expect(el).not.toHaveAttribute('data-visible');

    const io = MockIO.instances[0];
    expect(io.options).toMatchObject({ threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
    act(() => io.trigger(false));
    expect(el).not.toHaveAttribute('data-visible');
    act(() => io.trigger(true));
    expect(el).toHaveAttribute('data-visible');
    expect(io.disconnect).toHaveBeenCalled();
  });

  it('exposes the stagger delay as a CSS variable', () => {
    render(
      <Reveal delay={120}>
        <p>Hi</p>
      </Reveal>,
    );
    expect(wrapperOf('Hi').style.getPropertyValue('--reveal-delay')).toBe('120ms');
  });

  it('shows content immediately without IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    render(
      <Reveal>
        <p>Plain</p>
      </Reveal>,
    );
    expect(wrapperOf('Plain')).toHaveAttribute('data-visible');
  });

  it('shows content immediately when reduced motion is preferred', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    render(
      <Reveal>
        <p>Calm</p>
      </Reveal>,
    );
    expect(wrapperOf('Calm')).toHaveAttribute('data-visible');
    expect(MockIO.instances).toHaveLength(0);
  });

  it('disconnects on unmount', () => {
    const { unmount } = render(
      <Reveal>
        <p>Bye</p>
      </Reveal>,
    );
    unmount();
    expect(MockIO.instances[0].disconnect).toHaveBeenCalled();
  });
});
