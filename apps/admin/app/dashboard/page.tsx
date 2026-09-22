import { StatCard } from '@/components/StatCard';
import { getActiveLocale } from '@/lib/i18n';
import { createTranslator } from '@communitydirect/i18n';

/**
 * Overview. In Phase B these numbers come from the database via the server
 * Supabase client; the shell + metric definitions live here. We only surface
 * metrics push providers can actually measure (see docs/DECISIONS.md §Analytics).
 */
export default async function OverviewPage() {
  const locale = await getActiveLocale();
  const t = createTranslator(locale);

  const stats = [
    { label: t('admin.totalSubscribers'), value: '—', hint: 'Active followers' },
    { label: t('admin.messagesSent'), value: '—', hint: 'Last 30 days' },
    { label: t('admin.deliveryRate'), value: '—', hint: 'Accepted by provider' },
    { label: t('admin.scheduled'), value: '—', hint: 'Upcoming' },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-ink-900">{t('admin.overview')}</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} hint={s.hint} />
        ))}
      </div>
      <p className="mt-8 text-sm text-ink-500">
        Connect a Supabase project and sign in to populate live metrics (Phase B).
      </p>
    </div>
  );
}
