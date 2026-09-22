import Link from 'next/link';
import { getCurrentOrganization } from '@/lib/org';
import { listMessages, type MessageListItem } from '@/lib/messages';

const STATE_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-ink-700',
  SCHEDULED: 'bg-amber-100 text-amber-800',
  QUEUED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SENT: 'bg-green-100 text-green-800',
  PARTIALLY_FAILED: 'bg-orange-100 text-orange-800',
  FAILED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-slate-100 text-ink-500',
};

export default async function MessagesPage() {
  const current = await getCurrentOrganization();
  let messages: MessageListItem[] = [];
  if (current) messages = await listMessages(current.organization.id);

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-ink-900">Messages</h1>
          <p className="text-sm text-ink-500">Drafts, scheduled and sent messages.</p>
        </div>
        <Link
          href="/dashboard/messages/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          New message
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-ink-500">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Languages</th>
              <th className="px-4 py-2">State</th>
              <th className="px-4 py-2">Scheduled</th>
              <th className="px-4 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {messages.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-500">
                  No messages yet. Create your first one.
                </td>
              </tr>
            ) : (
              messages.map((m) => (
                <tr key={m.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-ink-900">{m.title ?? '—'}</td>
                  <td className="px-4 py-2 uppercase text-ink-500">{m.locales.join(' · ') || '—'}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATE_STYLES[m.state] ?? 'bg-slate-100'}`}>
                      {m.state}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-ink-500">
                    {m.scheduled_at ? new Date(m.scheduled_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-2 text-ink-500">{new Date(m.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
