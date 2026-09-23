/**
 * Account & privacy actions (GDPR self-service + abuse reporting), backed by the
 * hardening RPCs in supabase/migrations/0016. See docs/PRIVACY.md.
 */
import { supabase } from './supabase';

/** Export the signed-in user's own data as a JSON object. */
export async function exportMyData(): Promise<unknown> {
  const { data, error } = await supabase.rpc('export_my_data', {});
  if (error) throw error;
  return data;
}

/** Permanently delete the signed-in user's account, then sign out. */
export async function deleteMyAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_my_account', {});
  if (error) throw error;
  await supabase.auth.signOut();
}

/** Report an organization for abuse (rate-limited server-side). */
export async function reportOrganization(
  organizationId: string,
  reason: string,
  details?: string,
): Promise<void> {
  const { error } = await supabase.rpc('report_organization', {
    p_org: organizationId,
    p_reason: reason,
    p_details: details ?? null,
  });
  if (error) throw error;
}
