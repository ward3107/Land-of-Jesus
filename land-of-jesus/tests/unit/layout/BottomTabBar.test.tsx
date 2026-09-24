import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { navState } from '../helpers/mocks';
import { renderWithIntl } from '../helpers/intl';
import { BottomTabBar } from '@/components/layout/BottomTabBar';

vi.mock('@/lib/i18n/navigation', async () => (await import('../helpers/mocks')).navigationModule);

describe('BottomTabBar', () => {
  beforeEach(() => {
    navState.pathname = '/';
  });

  it('shows the five destinations with translated labels', () => {
    renderWithIntl(<BottomTabBar />);
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((a) => a.textContent)).toEqual(['Home', 'Explore', 'Projects', 'Stories', 'Visit']);
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/', '/explore', '/projects', '/stories', '/visit']);
  });

  it('marks only the current tab with aria-current="page"', () => {
    navState.pathname = '/projects';
    renderWithIntl(<BottomTabBar />);
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByRole('link').filter((a) => a.hasAttribute('aria-current'))).toHaveLength(1);
  });

  it('keeps Explore active on a church profile', () => {
    navState.pathname = '/churches/holy-sepulchre-jerusalem';
    renderWithIntl(<BottomTabBar />);
    expect(screen.getByRole('link', { name: 'Explore' })).toHaveAttribute('aria-current', 'page');
  });

  it('renders Arabic labels', () => {
    renderWithIntl(<BottomTabBar />, 'ar');
    expect(screen.getByRole('link', { name: 'استكشاف' })).toBeInTheDocument();
  });
});
