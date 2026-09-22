import { searchOrganizations, type Locale, type OrgSummary } from '@communitydirect/core';
import { supabase } from './supabase';

type OrgRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  verification_status: OrgSummary['verificationStatus'];
};

function toSummary(o: OrgRow): OrgSummary {
  return {
    id: o.id,
    name: o.name,
    slug: o.slug,
    description: o.description,
    category: o.category,
    verificationStatus: o.verification_status,
  };
}

/** Fetch a page of organizations for discovery (public RLS read). */
export async function fetchOrganizations(): Promise<OrgSummary[]> {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug, description, category, verification_status')
    .order('name', { ascending: true })
    .limit(100);
  if (error || !data) return [];
  return (data as OrgRow[]).map(toSummary);
}

/** Discover + rank organizations for a query (uses the shared ranking). */
export async function discover(query: string): Promise<OrgSummary[]> {
  return searchOrganizations(await fetchOrganizations(), query);
}

/** Explicit opt-in follow. */
export async function follow(
  organizationId: string,
  language?: Locale | null,
  signupSource?: string | null,
): Promise<void> {
  const { error } = await supabase.rpc('follow_organization', {
    p_organization_id: organizationId,
    p_language: language ?? null,
    p_signup_source: signupSource ?? null,
  });
  if (error) throw error;
}

export async function unfollow(organizationId: string): Promise<void> {
  const { error } = await supabase.rpc('unfollow_organization', {
    p_organization_id: organizationId,
  });
  if (error) throw error;
}

/** Organizations the current user actively follows. */
export async function listFollowing(): Promise<OrgSummary[]> {
  const { data: follows, error } = await supabase
    .from('organization_followers')
    .select('organization_id')
    .eq('active', true);
  if (error || !follows) return [];

  const ids = follows.map((f) => f.organization_id);
  if (ids.length === 0) return [];

  const { data, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, slug, description, category, verification_status')
    .in('id', ids)
    .order('name', { ascending: true });
  if (orgError || !data) return [];
  return (data as OrgRow[]).map(toSummary);
}
