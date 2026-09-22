import { SegmentBuilder } from '@/components/SegmentBuilder';
import { getCurrentOrganization } from '@/lib/org';
import { fetchAudienceProjections, listSegments, type SegmentSummary } from '@/lib/messages';

const OP_LABELS: Record<string, string> = {
  eq: 'is',
  in: 'is any of',
  contains: 'contains',
  exists: 'is set',
};

function describe(segment: SegmentSummary): string {
  if (segment.rules.length === 0) return 'All active subscribers';
  const join = segment.match_mode === 'all' ? ' AND ' : ' OR ';
  return segment.rules
    .map((r) => `${r.field} ${OP_LABELS[r.operator] ?? r.operator}${r.values.length ? ' ' + r.values.join(', ') : ''}`)
    .join(join);
}

export default async function SegmentsPage() {
  const current = await getCurrentOrganization();
  const [segments, projections] = current
    ? await Promise.all([
        listSegments(current.organization.id),
        fetchAudienceProjections(current.organization.id),
      ])
    : [[], []];

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold text-ink-900">Segments</h1>
      <p className="mb-6 text-sm text-ink-500">
        Build reusable audiences from language, channel, location, tags and signup source. Only
        voluntarily-provided attributes — no behavioral profiling.
      </p>

      <SegmentBuilder projections={projections} />

      <h2 className="mb-3 mt-8 text-sm font-semibold text-ink-900">Saved segments</h2>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-ink-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Rules</th>
            </tr>
          </thead>
          <tbody>
            {segments.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-ink-500">
                  No segments yet.
                </td>
              </tr>
            ) : (
              segments.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-ink-900">{s.name}</td>
                  <td className="px-4 py-2 text-ink-500">{describe(s)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
