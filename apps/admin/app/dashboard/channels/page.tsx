import type { Tables } from '@communitydirect/core';
import { ChannelForm } from '@/components/ChannelForm';
import { getCurrentOrganization } from '@/lib/org';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { toggleChannelArchived } from '@/app/actions/channels';

export default async function ChannelsPage() {
  const current = await getCurrentOrganization();
  const supabase = await createSupabaseServerClient();
  const { data } = current
    ? await supabase
        .from('channels')
        .select('*')
        .eq('organization_id', current.organization.id)
        .order('created_at', { ascending: true })
    : { data: null };

  const channels = (data ?? []) as Tables<'channels'>[];

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold text-ink-900">Channels</h1>
      <p className="mb-6 text-sm text-ink-500">
        Topics your subscribers can opt into (Daily, Youth, Events, Emergency…).
      </p>

      <ChannelForm />

      <ul className="mt-6 flex flex-col gap-2">
        {channels.length === 0 ? (
          <li className="text-sm text-ink-500">No channels yet.</li>
        ) : (
          channels.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-ink-900">
                  {c.name}
                  {c.is_default ? (
                    <span className="ms-2 rounded bg-brand-50 px-1.5 py-0.5 text-xs text-brand-700">
                      default
                    </span>
                  ) : null}
                  {c.is_archived ? (
                    <span className="ms-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-ink-500">
                      archived
                    </span>
                  ) : null}
                </p>
                <p className="font-mono text-xs text-ink-500">@{c.slug}</p>
              </div>
              <form action={toggleChannelArchived}>
                <input type="hidden" name="channelId" value={c.id} />
                <input type="hidden" name="archived" value={(!c.is_archived).toString()} />
                <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-ink-700 hover:bg-slate-100">
                  {c.is_archived ? 'Restore' : 'Archive'}
                </button>
              </form>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
