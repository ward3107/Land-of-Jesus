'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

interface Membership {
  church_id: string;
  role: 'CHURCH_MANAGER' | 'CHURCH_EDITOR';
  status: 'INVITED' | 'ACTIVE' | 'SUSPENDED';
  church: { name: string; slug: string } | null;
}

interface StaffRequest {
  id: string;
  church_slug: string;
  requester_email: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export function AccountView({ locale, configured, churches = [] }: { locale: string; configured: boolean; churches?: Array<{ slug: string; name: string }> }) {
  const t = useTranslations('Account');
  const nav = useTranslations('Navigation');
  const supabase = useMemo(() => configured ? createSupabaseBrowserClient() : null, [configured]);
  const [email, setEmail] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(configured);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);
  const [selectedChurch, setSelectedChurch] = useState('');
  const [staffRequests, setStaffRequests] = useState<StaffRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<StaffRequest[]>([]);
  const [staffBusy, setStaffBusy] = useState(false);
  const [staffMessage, setStaffMessage] = useState<'sent' | 'error' | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!active) return;
      setUser(data.user);
      setError(Boolean(authError));
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setError(true);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setMemberships([]);
        setStaffRequests([]);
        setPendingRequests([]);
        setUser(session?.user ?? null);
        setSent(false);
      }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !user) return;
    let active = true;
    void supabase.from('church_members')
      .select('church_id, role, status, churches(name, slug)')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .then(({ data, error: queryError }) => {
        if (!active) return;
        setMemberships(queryError ? [] : (data ?? []).map((row) => ({
          church_id: row.church_id,
          role: row.role as Membership['role'],
          status: row.status as Membership['status'],
          church: Array.isArray(row.churches) ? (row.churches[0] ?? null) : row.churches,
        })));
        setError(Boolean(queryError));
      }, () => {
        if (!active) return;
        setMemberships([]);
        setError(true);
      });
    return () => { active = false; };
  }, [supabase, user]);

  useEffect(() => {
    if (!supabase || !user) return;
    let active = true;
    void supabase.from('church_staff_requests').select('id,church_slug,requester_email,status')
      .eq('user_id', user.id).then(({ data }) => {
        if (active) setStaffRequests((data ?? []) as StaffRequest[]);
      }, () => { if (active) setStaffRequests([]); });
    return () => { active = false; };
  }, [supabase, user]);

  useEffect(() => {
    if (!supabase || !user) return;
    const managedSlugs = memberships.filter((membership) => membership.role === 'CHURCH_MANAGER' && membership.church)
      .map((membership) => membership.church!.slug);
    if (!managedSlugs.length) return;
    let active = true;
    void supabase.from('church_staff_requests').select('id,church_slug,requester_email,status')
      .in('church_slug', managedSlugs).eq('status', 'PENDING').then(({ data }) => {
        if (active) setPendingRequests((data ?? []) as StaffRequest[]);
      }, () => { if (active) setPendingRequests([]); });
    return () => { active = false; };
  }, [supabase, user, memberships]);

  async function requestChurchStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !selectedChurch || staffBusy) return;
    setStaffBusy(true);
    try {
      const { data, error: requestError } = await supabase.rpc('request_church_staff', { p_church_slug: selectedChurch });
      if (requestError || !data) throw requestError ?? new Error('Request not accepted');
      setStaffMessage('sent');
      const { data: requests } = await supabase.from('church_staff_requests').select('id,church_slug,requester_email,status')
        .eq('user_id', user!.id);
      setStaffRequests((requests ?? []) as StaffRequest[]);
    } catch {
      setStaffMessage('error');
    } finally {
      setStaffBusy(false);
    }
  }

  async function approveStaffRequest(requestId: string) {
    if (!supabase || staffBusy) return;
    setStaffBusy(true);
    try {
      const { data, error: approvalError } = await supabase.rpc('approve_church_staff_request', { p_request_id: requestId });
      if (approvalError || !data) throw approvalError ?? new Error('Approval not accepted');
      setPendingRequests((requests) => requests.filter((request) => request.id !== requestId));
      setStaffMessage(null);
    } catch {
      setStaffMessage('error');
    } finally {
      setStaffBusy(false);
    }
  }

  async function sendLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || busy) return;
    setBusy(true);
    setError(false);
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/${locale}/account` },
      });
      setError(Boolean(authError));
      setSent(!authError);
    } catch {
      setError(true);
      setSent(false);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!supabase || busy) return;
    setBusy(true);
    try {
      const { error: authError } = await supabase.auth.signOut();
      setError(Boolean(authError));
      if (!authError) { setUser(null); setMemberships([]); setStaffRequests([]); setPendingRequests([]); }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return <p className="mt-6 rounded-card border border-hairline bg-surface p-5 text-muted">{t('unavailable')}</p>;
  }

  if (loading) return <p className="mt-6 text-muted" role="status">{t('loading')}</p>;

  if (!user) {
    return (
      <div className="mt-6 rounded-card border border-hairline bg-surface p-5 md:p-7">
        <form onSubmit={sendLink} className="space-y-4">
          <label htmlFor="account-email" className="block text-sm font-medium text-night">{t('email')}</label>
          <input
            id="account-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-12 w-full rounded-control border border-hairline px-4 text-night focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button type="submit" disabled={busy} className="h-12 w-full rounded-full bg-primary-600 px-6 font-medium text-white hover:bg-primary-700 disabled:opacity-50">
            {t('sendLink')}
          </button>
        </form>
        {sent ? <p className="mt-4 text-hills" role="status">{t('checkEmail')}</p> : null}
        {error ? <p className="mt-4 text-red-700" role="alert">{t('error')}</p> : null}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center justify-between gap-4 rounded-card border border-hairline bg-surface p-5">
        <p className="min-w-0 break-all text-night">{user.email}</p>
        <button type="button" onClick={signOut} disabled={busy} className="shrink-0 rounded-full border border-hairline px-4 py-2 text-sm font-medium text-night hover:bg-stone-100 disabled:opacity-50">
          {t('signOut')}
        </button>
      </div>
      <section aria-label={nav('churches')} className="rounded-card border border-hairline bg-surface p-5">
        <h2 className="text-xl font-semibold text-night">{nav('churches')}</h2>
        {memberships.length ? (
          <ul className="mt-4 divide-y divide-hairline">
            {memberships.map((membership) => (
              <li key={membership.church_id} className="flex items-center justify-between gap-4 py-3">
                {membership.church ? (
                  <Link href={`/churches/${membership.church.slug}`} className="font-medium text-primary-700 hover:underline">
                    {membership.church.name}
                  </Link>
                ) : <span>{membership.church_id}</span>}
                <span className="text-sm text-muted">{t(membership.role === 'CHURCH_MANAGER' ? 'manager' : 'editor')}</span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-3 text-muted">{t('noChurches')}</p>}
        {error ? <p className="mt-3 text-red-700" role="alert">{t('error')}</p> : null}
      </section>
      <section className="rounded-card border border-hairline bg-surface p-5">
        <h2 className="text-xl font-semibold text-night">{t('requestChurch')}</h2>
        <p className="mt-2 text-sm text-muted">{t('requestInfo')}</p>
        <form onSubmit={requestChurchStaff} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label htmlFor="staff-church" className="sr-only">{t('selectChurch')}</label>
          <select id="staff-church" required value={selectedChurch} onChange={(event) => setSelectedChurch(event.target.value)}
            className="h-11 min-w-0 flex-1 rounded-control border border-hairline bg-surface px-3 text-night">
            <option value="">{t('selectChurch')}</option>
            {churches.map((church) => <option key={church.slug} value={church.slug}>{church.name}</option>)}
          </select>
          <button type="submit" disabled={staffBusy || !selectedChurch} className="h-11 rounded-full bg-primary-700 px-5 font-medium text-white disabled:opacity-40">{t('submitRequest')}</button>
        </form>
        {staffMessage === 'sent' && <p role="status" className="mt-3 text-sm text-green-700">{t('requestSent')}</p>}
        {staffMessage === 'error' && <p role="alert" className="mt-3 text-sm text-red-700">{t('requestError')}</p>}
        {staffRequests.length > 0 && <ul className="mt-4 space-y-2 text-sm text-muted">
          {staffRequests.map((request) => <li key={request.id}>{churches.find((church) => church.slug === request.church_slug)?.name ?? request.church_slug} · {t(request.status === 'APPROVED' ? 'approved' : request.status === 'REJECTED' ? 'rejected' : 'pending')}</li>)}
        </ul>}
      </section>
      {pendingRequests.length > 0 && <section className="rounded-card border border-hairline bg-surface p-5">
        <h2 className="text-xl font-semibold text-night">{t('pendingStaff')}</h2>
        <p className="mt-2 text-sm text-muted">{t('verifyFirst')}</p>
        <ul className="mt-4 space-y-3">{pendingRequests.map((request) => <li key={request.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3">
          <span className="min-w-0 break-all text-sm">{request.requester_email} · {churches.find((church) => church.slug === request.church_slug)?.name ?? request.church_slug}</span>
          <button type="button" disabled={staffBusy} onClick={() => approveStaffRequest(request.id)} className="rounded-full bg-primary-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">{t('approveEditor')}</button>
        </li>)}</ul>
      </section>}
    </div>
  );
}
