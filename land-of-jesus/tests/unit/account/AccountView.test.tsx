import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithIntl } from '../helpers/intl';
import { AccountView } from '@/components/account/AccountView';

vi.mock('@/lib/i18n/navigation', async () => (await import('../helpers/mocks')).navigationModule);

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithOtp: vi.fn(),
  signOut: vi.fn(),
  from: vi.fn(),
}));

vi.mock('@/lib/supabase/browser', () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      getUser: mocks.getUser,
      onAuthStateChange: mocks.onAuthStateChange,
      signInWithOtp: mocks.signInWithOtp,
      signOut: mocks.signOut,
    },
    from: mocks.from,
  }),
}));

describe('AccountView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    mocks.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    mocks.signInWithOtp.mockResolvedValue({ error: null });
    mocks.signOut.mockResolvedValue({ error: null });
  });

  it('does not offer a broken sign-in form without Supabase configuration', () => {
    renderWithIntl(<AccountView locale="en" configured={false} />);
    expect(screen.getByText('Accounts are not available yet.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send sign-in link' })).not.toBeInTheDocument();
  });

  it('sends a sign-in link back to the current locale', async () => {
    renderWithIntl(<AccountView locale="en" configured />);
    fireEvent.change(await screen.findByLabelText('Email address'), { target: { value: 'pilgrim@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send sign-in link' }));

    await waitFor(() => expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      email: 'pilgrim@example.com',
      options: { emailRedirectTo: `${window.location.origin}/en/account` },
    }));
    expect(await screen.findByText('Check your email.')).toBeInTheDocument();
  });

  it('shows a recoverable sign-in form when the auth check fails', async () => {
    mocks.getUser.mockRejectedValue(new Error('network unavailable'));
    renderWithIntl(<AccountView locale="en" configured />);
    expect(await screen.findByRole('button', { name: 'Send sign-in link' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Please try again.');
  });

  it('shows only the signed-in user’s active church memberships', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'worker@example.com' } } });
    const query = { select: vi.fn(), eq: vi.fn() };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValueOnce(query).mockResolvedValueOnce({
      data: [{ church_id: 'church-1', role: 'CHURCH_MANAGER', status: 'ACTIVE', churches: [{ name: 'Church of the Nativity', slug: 'nativity' }] }],
      error: null,
    });
    const staffQuery = { select: vi.fn(), eq: vi.fn(), in: vi.fn() };
    staffQuery.select.mockReturnValue(staffQuery);
    staffQuery.in.mockReturnValue(staffQuery);
    staffQuery.eq.mockResolvedValue({ data: [], error: null });
    mocks.from.mockImplementation((table) => table === 'church_members' ? query : staffQuery);

    renderWithIntl(<AccountView locale="en" configured />);
    expect(await screen.findByRole('link', { name: 'Church of the Nativity' })).toHaveAttribute('href', '/churches/nativity');
    expect(screen.getByText('Manager')).toBeInTheDocument();
    expect(mocks.from).toHaveBeenCalledWith('church_members');
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(query.eq).toHaveBeenCalledWith('status', 'ACTIVE');
  });
});
