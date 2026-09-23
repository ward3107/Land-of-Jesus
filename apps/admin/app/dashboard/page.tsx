import { formatRate, summarizeDelivery } from '@communitydirect/core';
import { StatCard } from '@/components/StatCard';
import { getActiveLocale } from '@/lib/i18n';
import { getCurrentOrganization } from '@/lib/org';
import { fetchOrganizationAnalytics } from '@/lib/analytics';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createTranslator } from '@communitydirect/i18n';

async function counts(organizationId: string) {
  const supabase = await createSupabaseServerClient();
  const followers = supabase
    .from('organization_followers')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('active', true);
  const sent = supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('state', 'SENT');
  const scheduled = supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('state', 'SCHEDULED');

  const [f, s, sc] = await Promise.all([followers, sent, scheduled]);
  return {
    followers: f.count ?? 0,
    sent: s.count ?? 0,
    scheduled: sc.count ?? 0,
  };
}

export default async function OverviewPage() {
  const locale = await getActiveLocale();
  const t = createTranslator(locale);
  const current = await getCurrentOrganization();

  // Metrics we can actually measure (see docs/DECISIONS.md §Analytics).
  const [stats, analytics] = current
    ? await Promise.all([
        counts(current.organization.id).catch(() => null),
        fetchOrganizationAnalytics(current.organization.id),
      ])
    : [null, null];

  const deliveryRate = analytics
    ? formatRate(
        summarizeDelivery({
          attempted: analytics.attempts_attempted,
          accepted: analytics.attempts_accepted,
          failed: analytics.attempts_failed,
          invalid: analytics.attempts_invalid,
        }).deliveryRate,
      )
    : '—';

  const tiles = [
    { label: t('admin.totalSubscribers'), value: stats ? stats.followers : '—', hint: 'Active followers' },
    { label: t('admin.messagesSent'), value: stats ? stats.sent : '—', hint: 'All time' },
    { label: t('admin.scheduled'), value: stats ? stats.scheduled : '—', hint: 'Upcoming' },
    { label: t('admin.deliveryRate'), value: deliveryRate, hint: 'Accepted by provider' },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-ink-900">{t('admin.overview')}</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} hint={s.hint} />
        ))}
      </div>
      {!stats ? (
        <p className="mt-8 text-sm text-ink-500">
          Connect a Supabase project and sign in to populate live metrics.
        </p>
      ) : null}
    </div>
  );
}
