import type { MembershipRole, Tables } from '@communitydirect/core';
import { createSupabaseServerClient } from './supabase/server';

export interface CurrentOrg {
  organization: Tables<'organizations'>;
  role: MembershipRole;
}

/**
 * Resolve the admin's active organization: their first membership (Phase B
 * assumes a single org per admin; an org switcher lands later). Returns null if
 * the user administers no organization yet (→ onboarding).
 */
export async function getCurrentOrganization(): Promise<CurrentOrg | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('organization_members')
      .select('role, organization:organizations(*)')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error || !data || !data.organization) return null;
    return {
      role: data.role as MembershipRole,
      organization: data.organization as unknown as Tables<'organizations'>,
    };
  } catch {
    return null;
  }
}
