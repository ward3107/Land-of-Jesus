import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderWithIntl } from '../helpers/intl';
import { IntroVideo } from '@/components/home/IntroVideo';

class IntersectionObserverMock {
  disconnect() {}
  observe() {}
}

describe('IntroVideo', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('tries audible autoplay when the browser permits it', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const { container } = renderWithIntl(<IntroVideo />);
    const video = container.querySelector('video');

    await waitFor(() => expect(play).toHaveBeenCalled());
    expect(video).not.toBeNull();
    expect(video).not.toHaveAttribute('muted');
  });

  it('falls back to muted playback when audible autoplay is blocked', async () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockRejectedValueOnce(new Error('Autoplay blocked'))
      .mockResolvedValue(undefined);
    const { container, getByRole } = renderWithIntl(<IntroVideo />);
    const video = container.querySelector('video');

    await waitFor(() => expect(play).toHaveBeenCalledTimes(2));
    expect(video?.muted).toBe(true);
    expect(getByRole('button', { name: 'Turn on sound' })).toBeInTheDocument();
  });
});
