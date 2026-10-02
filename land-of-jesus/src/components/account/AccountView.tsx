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

export function AccountView({ locale, configured }: { locale: string; configured: boolean }) {
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
      if (!authError) { setUser(null); setMemberships([]); }
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
    </div>
  );
}
