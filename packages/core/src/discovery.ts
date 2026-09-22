/**
 * Organization discovery/search (client-side ranking).
 *
 * The mobile Discover tab fetches a page of organizations (RLS allows public
 * reads) and ranks them for a query. Keeping the ranking here makes it testable
 * and identical wherever discovery is shown.
 */

export interface OrgSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
}

function score(org: OrgSummary, q: string): number {
  const name = org.name.toLowerCase();
  const slug = org.slug.toLowerCase();
  if (name === q || slug === q) return 100;
  if (name.startsWith(q) || slug.startsWith(q)) return 80;
  if (name.includes(q)) return 60;
  if (slug.includes(q)) return 50;
  if (org.category?.toLowerCase().includes(q)) return 30;
  if (org.description?.toLowerCase().includes(q)) return 20;
  return 0;
}

/**
 * Filter + rank organizations for `query`. An empty query returns all, verified
 * first then alphabetical. Verified orgs get a small ranking boost on ties.
 */
export function searchOrganizations(orgs: readonly OrgSummary[], query: string): OrgSummary[] {
  const q = query.trim().toLowerCase();
  const boost = (o: OrgSummary) => (o.verificationStatus === 'VERIFIED' ? 5 : 0);

  if (!q) {
    return [...orgs].sort(
      (a, b) => boost(b) - boost(a) || a.name.localeCompare(b.name),
    );
  }

  // Filter on the query match first; the verified boost only affects ordering
  // among orgs that already match (it must never lift a non-match into results).
  return orgs
    .map((o) => ({ o, base: score(o, q) }))
    .filter((x) => x.base > 0)
    .sort((a, b) => b.base + boost(b.o) - (a.base + boost(a.o)) || a.o.name.localeCompare(b.o.name))
    .map((x) => x.o);
}
