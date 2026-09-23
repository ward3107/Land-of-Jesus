import { formatRate, joinConversionRate, summarizeDelivery } from '@communitydirect/core';
import { StatCard } from '@/components/StatCard';
import { getCurrentOrganization } from '@/lib/org';
import { fetchOrganizationAnalytics, listRecentJobs, type RecentJob } from '@/lib/analytics';

const JOB_STATE_STYLES: Record<string, string> = {
  PENDING: 'bg-slate-100 text-ink-700',
  RESOLVING: 'bg-blue-100 text-blue-800',
  QUEUED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-slate-100 text-ink-500',
};

export default async function AnalyticsPage() {
  const current = await getCurrentOrganization();
  const analytics = current ? await fetchOrganizationAnalytics(current.organization.id) : null;
  const recent: RecentJob[] = current ? await listRecentJobs(current.organization.id) : [];

  if (!analytics) {
    return (
      <div className="max-w-4xl">
        <h1 className="mb-1 text-2xl font-bold text-ink-900">Analytics</h1>
        <p className="text-sm text-ink-500">
          Measured delivery and reach analytics appear here once you connect a Supabase project and
          send your first message.
        </p>
      </div>
    );
  }

  const delivery = summarizeDelivery({
    attempted: analytics.attempts_attempted,
    accepted: analytics.attempts_accepted,
    failed: analytics.attempts_failed,
    invalid: analytics.attempts_invalid,
  });
  const conversion = joinConversionRate({
    scans: analytics.join_scans,
    opens: 0,
    installs: 0,
    follows: analytics.join_follows,
  });

  const deliveryTiles = [
    { label: 'Push delivery rate', value: formatRate(delivery.deliveryRate), hint: 'Accepted by provider' },
    { label: 'Accepted', value: delivery.accepted.toLocaleString(), hint: 'Delivered to Expo' },
    { label: 'Failed', value: delivery.failed.toLocaleString(), hint: 'Send errors' },
    { label: 'Invalid tokens', value: delivery.invalid.toLocaleString(), hint: 'Cleaned up' },
  ];
  const reachTiles = [
    { label: 'Active subscribers', value: analytics.followers_active.toLocaleString(), hint: 'Opted-in followers' },
    { label: 'Messages sent', value: analytics.messages_sent.toLocaleString(), hint: 'All time' },
    { label: 'Scheduled', value: analytics.messages_scheduled.toLocaleString(), hint: 'Upcoming' },
    { label: 'Delivery jobs', value: `${analytics.jobs_completed}/${analytics.jobs_total}`, hint: 'Completed / total' },
  ];

  return (
    <div className="max-w-4xl">
      <h1 className="mb-1 text-2xl font-bold text-ink-900">Analytics</h1>
      <p className="mb-6 text-sm text-ink-500">
        Measured signals only — provider acceptance, failures, token hygiene and the join funnel. No
        open/tap metrics the transport can&apos;t report (see docs/ANALYTICS.md).
      </p>

      <h2 className="mb-3 text-sm font-semibold text-ink-900">Delivery</h2>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {deliveryTiles.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} hint={s.hint} />
        ))}
      </div>

      <h2 className="mb-3 text-sm font-semibold text-ink-900">Reach</h2>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {reachTiles.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} hint={s.hint} />
        ))}
      </div>

      <h2 className="mb-3 text-sm font-semibold text-ink-900">Join funnel</h2>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="QR / link scans" value={analytics.join_scans.toLocaleString()} hint="From join links" />
        <StatCard label="Follows via link" value={analytics.join_follows.toLocaleString()} hint="Attributed" />
        <StatCard label="Scan → follow" value={formatRate(conversion)} hint="Conversion" />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-ink-900">Recent sends</h2>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-ink-500">
            <tr>
              <th className="px-4 py-2">Message</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Audience</th>
              <th className="px-4 py-2">Sent</th>
              <th className="px-4 py-2">Failed</th>
              <th className="px-4 py-2">When</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-500">
                  No delivery jobs yet.
                </td>
              </tr>
            ) : (
              recent.map((j) => (
                <tr key={j.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-ink-900">{j.title ?? '—'}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${JOB_STATE_STYLES[j.status] ?? 'bg-slate-100'}`}>
                      {j.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-ink-500">{j.audience_size ?? '—'}</td>
                  <td className="px-4 py-2 text-green-700">{j.sent_count}</td>
                  <td className="px-4 py-2 text-red-700">{j.failed_count}</td>
                  <td className="px-4 py-2 text-ink-500">
                    {new Date(j.completed_at ?? j.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
