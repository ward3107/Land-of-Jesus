import type { Tables } from '@communitydirect/core';
import { getCurrentOrganization } from '@/lib/org';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function SubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; lang?: string }>;
}) {
  const { q = '', lang = '' } = await searchParams;
  const current = await getCurrentOrganization();
  const supabase = await createSupabaseServerClient();

  let followers: Tables<'organization_followers'>[] = [];
  if (current) {
    let query = supabase
      .from('organization_followers')
      .select('*')
      .eq('organization_id', current.organization.id)
      .eq('active', true)
      .order('followed_at', { ascending: false })
      .limit(200);
    if (lang) query = query.eq('language', lang);
    const { data } = await query;
    followers = (data ?? []) as Tables<'organization_followers'>[];
    if (q) {
      const needle = q.toLowerCase();
      followers = followers.filter(
        (f) =>
          f.location?.toLowerCase().includes(needle) ||
          f.signup_source?.toLowerCase().includes(needle) ||
          f.tags.some((t) => t.toLowerCase().includes(needle)),
      );
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="mb-1 text-2xl font-bold text-ink-900">Subscribers</h1>
      <p className="mb-6 text-sm text-ink-500">
        Your active followers. Device-level data is never shown (privacy-first).
      </p>

      <form className="mb-4 flex flex-wrap gap-3" role="search">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search location, tag, or source"
          className="min-w-56 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select name="lang" defaultValue={lang} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">All languages</option>
          <option value="ar">Arabic</option>
          <option value="he">Hebrew</option>
          <option value="en">English</option>
        </select>
        <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Filter
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-ink-500">
            <tr>
              <th className="px-4 py-2">Subscriber</th>
              <th className="px-4 py-2">Language</th>
              <th className="px-4 py-2">Location</th>
              <th className="px-4 py-2">Tags</th>
              <th className="px-4 py-2">Source</th>
              <th className="px-4 py-2">Joined</th>
            </tr>
          </thead>
          <tbody>
            {followers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-500">
                  No subscribers match.
                </td>
              </tr>
            ) : (
              followers.map((f) => (
                <tr key={f.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-mono text-xs text-ink-500">{f.profile_id.slice(0, 8)}…</td>
                  <td className="px-4 py-2">{f.language ?? '—'}</td>
                  <td className="px-4 py-2">{f.location ?? '—'}</td>
                  <td className="px-4 py-2">{f.tags.length ? f.tags.join(', ') : '—'}</td>
                  <td className="px-4 py-2">{f.signup_source ?? '—'}</td>
                  <td className="px-4 py-2">{new Date(f.followed_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
