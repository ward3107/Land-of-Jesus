import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Tables } from '@communitydirect/core';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const APP_SCHEME = process.env.APP_DEEP_LINK_SCHEME ?? 'communitydirect';

/**
 * Public organization profile (spec §14/§29). Readable without auth (RLS allows
 * public discovery reads). Following happens in the app — never auto-subscribe.
 */
export default async function OrgProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!org) notFound();
  const organization = org as Tables<'organizations'>;

  const { data: channelData } = await supabase
    .from('channels')
    .select('*')
    .eq('organization_id', organization.id)
    .eq('is_archived', false)
    .order('created_at', { ascending: true });
  const channels = (channelData ?? []) as Tables<'channels'>[];

  const verified = organization.verification_status === 'VERIFIED';

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-6 py-12">
      <header className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-2xl font-bold text-brand-600">
          {organization.name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-ink-900">
            {organization.name}
            {verified ? <span title="Verified" className="text-brand-600">✓</span> : null}
          </h1>
          <p className="font-mono text-xs text-ink-500">@{organization.slug}</p>
        </div>
      </header>

      {organization.description ? (
        <p className="text-ink-700">{organization.description}</p>
      ) : null}

      <a
        href={`${APP_SCHEME}://o/${organization.slug}`}
        className="rounded-lg bg-brand-600 px-5 py-3 text-center font-medium text-white hover:bg-brand-700"
      >
        Follow in the app
      </a>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-500">Channels</h2>
        <ul className="flex flex-wrap gap-2">
          {channels.length === 0 ? (
            <li className="text-sm text-ink-500">No public channels yet.</li>
          ) : (
            channels.map((c) => (
              <li key={c.id} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm">
                {c.name}
              </li>
            ))
          )}
        </ul>
      </section>

      <Link href="/" className="text-sm text-brand-600 hover:underline">
        ← CommunityDirect
      </Link>
    </main>
  );
}
