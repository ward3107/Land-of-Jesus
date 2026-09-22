'use server';

import { revalidatePath } from 'next/cache';
import { generateJoinCode } from '@communitydirect/core';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentOrganization } from '@/lib/org';

export interface JoinLinkState {
  error?: string;
  code?: string;
}

/** Create a shareable join link (with an optional campaign tag). */
export async function createJoinLink(
  _prev: JoinLinkState,
  formData: FormData,
): Promise<JoinLinkState> {
  const current = await getCurrentOrganization();
  if (!current) return { error: 'No organization found for your account.' };

  const campaign = ((formData.get('campaign') as string) || '').trim() || null;
  const supabase = await createSupabaseServerClient();
  const code = generateJoinCode();

  const { error } = await supabase.from('join_links').insert({
    organization_id: current.organization.id,
    code,
    campaign,
  });
  if (error) return { error: error.message };

  revalidatePath('/dashboard/settings');
  return { code };
}
