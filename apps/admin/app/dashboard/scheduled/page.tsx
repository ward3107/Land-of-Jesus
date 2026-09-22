import { getCurrentOrganization } from '@/lib/org';
import { listScheduled } from '@/lib/messages';

export default async function ScheduledPage() {
  const current = await getCurrentOrganization();
  const { recurring, oneOff } = current
    ? await listScheduled(current.organization.id)
    : { recurring: [], oneOff: [] };

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold text-ink-900">Scheduled</h1>
      <p className="mb-6 text-sm text-ink-500">
        One-off and recurring sends. All times are stored in UTC and fire DST-correctly in each
        schedule&apos;s time zone.
      </p>

      <h2 className="mb-3 text-sm font-semibold text-ink-900">Recurring</h2>
      <div className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-ink-500">
            <tr>
              <th className="px-4 py-2">Message</th>
              <th className="px-4 py-2">Frequency</th>
              <th className="px-4 py-2">Time zone</th>
              <th className="px-4 py-2">Next run (UTC)</th>
            </tr>
          </thead>
          <tbody>
            {recurring.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink-500">
                  No recurring sends.
                </td>
              </tr>
            ) : (
              recurring.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-ink-900">{r.title ?? '—'}</td>
                  <td className="px-4 py-2 capitalize text-ink-700">{r.kind}</td>
                  <td className="px-4 py-2 text-ink-500">{r.time_zone ?? '—'}</td>
                  <td className="px-4 py-2 text-ink-500">
                    {r.next_run_at ? new Date(r.next_run_at).toUTCString() : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-ink-900">Upcoming one-off</h2>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-ink-500">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Scheduled (UTC)</th>
            </tr>
          </thead>
          <tbody>
            {oneOff.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-ink-500">
                  No upcoming one-off sends.
                </td>
              </tr>
            ) : (
              oneOff.map((m) => (
                <tr key={m.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-ink-900">{m.title ?? '—'}</td>
                  <td className="px-4 py-2 text-ink-500">
                    {m.scheduled_at ? new Date(m.scheduled_at).toUTCString() : '—'}
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
