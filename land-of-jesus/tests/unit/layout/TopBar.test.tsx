import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { navState } from '../helpers/mocks';
import { renderWithIntl } from '../helpers/intl';
import { TopBar } from '@/components/layout/TopBar';

vi.mock('@/lib/i18n/navigation', async () => (await import('../helpers/mocks')).navigationModule);

describe('TopBar', () => {
  beforeEach(() => {
    navState.pathname = '/stories';
  });

  it('links the wordmark home', () => {
    renderWithIntl(<TopBar />);
    expect(screen.getByRole('link', { name: 'Land of Jesus' })).toHaveAttribute('href', '/');
  });

  it('shows the desktop destinations with the current one marked', () => {
    renderWithIntl(<TopBar />);
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(within(nav).getAllByRole('link')).toHaveLength(5);
    expect(within(nav).getByRole('link', { name: 'Stories' })).toHaveAttribute('aria-current', 'page');
  });

  it('offers the language sheet', () => {
    renderWithIntl(<TopBar />);
    expect(screen.getByRole('button', { name: 'Language: English' })).toHaveAttribute('aria-haspopup', 'dialog');
  });
});
