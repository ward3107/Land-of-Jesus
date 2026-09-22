'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { slugify } from '@communitydirect/core';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentOrganization } from '@/lib/org';

const channelSchema = z.object({
  name: z.string().trim().min(1, 'Channel name is required').max(80),
  description: z.string().trim().max(500).optional(),
});

export interface ChannelActionState {
  error?: string;
  ok?: boolean;
}

export async function createChannel(
  _prev: ChannelActionState,
  formData: FormData,
): Promise<ChannelActionState> {
  const parsed = channelSchema.safeParse({
    name: formData.get('name'),
    description: (formData.get('description') as string) || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const current = await getCurrentOrganization();
  if (!current) return { error: 'No organization found for your account.' };

  const supabase = await createSupabaseServerClient();
  const slug = slugify(parsed.data.name) || `channel-${Date.now().toString(36)}`;
  const { error } = await supabase.from('channels').insert({
    organization_id: current.organization.id,
    name: parsed.data.name,
    slug,
    description: parsed.data.description ?? null,
  });
  if (error) {
    if (error.code === '23505') return { error: `A channel with handle "${slug}" already exists.` };
    return { error: error.message };
  }

  revalidatePath('/dashboard/channels');
  return { ok: true };
}

export async function toggleChannelArchived(formData: FormData): Promise<void> {
  const channelId = String(formData.get('channelId') ?? '');
  const archived = formData.get('archived') === 'true';
  if (!channelId) return;
  const supabase = await createSupabaseServerClient();
  await supabase.from('channels').update({ is_archived: archived }).eq('id', channelId);
  revalidatePath('/dashboard/channels');
}
