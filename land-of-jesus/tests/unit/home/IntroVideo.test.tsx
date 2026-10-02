import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/react';
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

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('tries audible autoplay when the browser permits it', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const { container, queryByRole } = renderWithIntl(<IntroVideo />);
    const video = container.querySelector('video');

    await waitFor(() => expect(play).toHaveBeenCalled());
    expect(video).not.toBeNull();
    expect(video?.muted).toBe(false);
    expect(queryByRole('button', { name: 'Mute' })).not.toBeInTheDocument();
    expect(container.querySelector('section')).toHaveClass('h-[200svh]');
  });

  it('waits for a tap instead of muting when audible autoplay is blocked', async () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockRejectedValueOnce(new Error('Autoplay blocked'))
      .mockResolvedValue(undefined);
    const { container, getByRole } = renderWithIntl(<IntroVideo />);
    const video = container.querySelector('video');

    const startButton = await waitFor(() => getByRole('button', { name: 'Turn on sound' }));
    expect(play).toHaveBeenCalledTimes(1);
    expect(video?.muted).toBe(false);

    fireEvent.click(startButton);
    await waitFor(() => expect(play).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(startButton).not.toBeInTheDocument());
    expect(video?.muted).toBe(false);
  });
});
