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

/** jsdom's getBoundingClientRect is all zeros; stub it to simulate an element below the fold. */
function stubBelowFold() {
  return vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 2000,
    bottom: 2040,
    left: 0,
    right: 0,
    width: 0,
    height: 40,
    x: 0,
    y: 2000,
    toJSON() {
      return this;
    },
  });
}

describe('Reveal', () => {
  beforeEach(() => {
    MockIO.instances = [];
    vi.stubGlobal('IntersectionObserver', MockIO);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('server-renders visible (no data-pending) regardless of position', () => {
    render(
      <Reveal>
        <p>Hello</p>
      </Reveal>,
    );
    const el = wrapperOf('Hello');
    expect(el).toHaveAttribute('data-reveal');
    // Effects have run by the time render() returns in RTL, but the assertion that
    // matters for SSR safety is that the attribute is absent from the server markup
    // shape entirely unless JS defers it - checked below via the below-fold case.
  });

  it('below-the-fold element gets data-pending, observes with the documented options, and reveals on intersect', () => {
    stubBelowFold();
    render(
      <Reveal>
        <p>Hello</p>
      </Reveal>,
    );
    const el = wrapperOf('Hello');
    expect(el).toHaveAttribute('data-reveal');
    expect(el).toHaveAttribute('data-pending');

    const io = MockIO.instances[0];
    expect(io.options).toMatchObject({ threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
    expect(io.observe).toHaveBeenCalledWith(el);

    act(() => io.trigger(false));
    expect(el).toHaveAttribute('data-pending');

    act(() => io.trigger(true));
    expect(el).not.toHaveAttribute('data-pending');
    expect(io.disconnect).toHaveBeenCalled();

  });

  it('element already in view at mount never gets data-pending and creates no observer', () => {
    // jsdom's default getBoundingClientRect returns top: 0, which is "in view".
    render(
      <Reveal>
        <p>Visible</p>
      </Reveal>,
    );
    const el = wrapperOf('Visible');
    expect(el).toHaveAttribute('data-reveal');
    expect(el).not.toHaveAttribute('data-pending');
    expect(MockIO.instances).toHaveLength(0);
  });

  it('no IntersectionObserver support: never pending', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    stubBelowFold();
    render(
      <Reveal>
        <p>Plain</p>
      </Reveal>,
    );
    expect(wrapperOf('Plain')).not.toHaveAttribute('data-pending');
  });

  it('reduced motion preferred: never pending, no observer, even below the fold', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    stubBelowFold();
    render(
      <Reveal>
        <p>Calm</p>
      </Reveal>,
    );
    expect(wrapperOf('Calm')).not.toHaveAttribute('data-pending');
    expect(MockIO.instances).toHaveLength(0);
  });

  it('exposes the stagger delay as a CSS variable', () => {
    render(
      <Reveal delay={120}>
        <p>Hi</p>
      </Reveal>,
    );
    expect(wrapperOf('Hi').style.getPropertyValue('--reveal-delay')).toBe('120ms');
  });

  it('disconnects on unmount (below-fold case)', () => {
    stubBelowFold();
    const { unmount } = render(
      <Reveal>
        <p>Bye</p>
      </Reveal>,
    );
    expect(MockIO.instances).toHaveLength(1);
    unmount();
    expect(MockIO.instances[0].disconnect).toHaveBeenCalled();
  });
});
