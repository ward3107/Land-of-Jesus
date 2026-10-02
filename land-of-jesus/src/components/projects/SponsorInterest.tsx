'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export function SponsorInterest({ projectSlug, configured }: { projectSlug: string; configured: boolean }) {
  const t = useTranslations('Sponsor');
  const supabase = useMemo(() => configured ? createSupabaseBrowserClient() : null, [configured]);
  const [user, setUser] = useState<User | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<'sent' | 'error' | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getUser().then(({ data }) => { if (active) setUser(data.user); }, () => { if (active) setUser(null); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUser(session?.user ?? null);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [supabase]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user || busy) return;
    const amountUsd = Number(amount);
    if (!Number.isInteger(amountUsd) || amountUsd < 1 || amountUsd > 100000000) { setStatus('error'); return; }
    setBusy(true);
    setStatus(null);
    try {
      const { error } = await supabase.from('sponsor_interests').upsert({
        user_id: user.id, project_slug: projectSlug, amount_usd: amountUsd,
        note: note.trim(), status: 'PENDING',
      }, { onConflict: 'user_id,project_slug' });
      if (error) throw error;
      setStatus('sent');
    } catch {
      setStatus('error');
    } finally {
      setBusy(false);
    }
  }

  return <div className="mt-5 border-t border-primary-200 pt-5">
    <h4 className="font-semibold text-night">{t('title')}</h4>
    <p className="mt-2 text-sm leading-relaxed text-muted">{t('description')}</p>
    {!configured ? <p className="mt-3 text-sm text-muted">{t('unavailable')}</p> : !user ?
      <Link href="/account" className="mt-4 inline-flex rounded-full bg-primary-700 px-5 py-2 text-sm font-medium text-white">{t('signIn')}</Link> :
      <form onSubmit={submit} className="mt-4 space-y-3">
        <label className="block text-sm font-medium text-night">{t('amount')}
          <input type="number" inputMode="numeric" min="1" max="100000000" step="1" required value={amount}
            onChange={(event) => setAmount(event.target.value)} className="mt-1 h-11 w-full rounded-control border border-hairline bg-surface px-3" />
        </label>
        <label className="block text-sm font-medium text-night">{t('note')}
          <textarea value={note} maxLength={2000} onChange={(event) => setNote(event.target.value)} rows={3}
            className="mt-1 w-full rounded-control border border-hairline bg-surface p-3" />
        </label>
        <button type="submit" disabled={busy} className="w-full rounded-full bg-primary-700 px-5 py-2.5 font-medium text-white disabled:opacity-40">{t('submit')}</button>
        {status === 'sent' && <p role="status" className="text-sm text-green-700">{t('sent')}</p>}
        {status === 'error' && <p role="alert" className="text-sm text-red-700">{t('error')}</p>}
      </form>}
  </div>;
}
