'use server';

import { revalidatePath } from 'next/cache';
import {
  segmentDefinitionSchema,
  type SegmentField,
  type SegmentOperator,
} from '@communitydirect/core';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { getCurrentOrganization } from '@/lib/org';

export interface SegmentActionState {
  error?: string;
  ok?: boolean;
}

const nameSchema = z.string().trim().min(1, 'Name the segment').max(80);

export async function createSegment(
  _prev: SegmentActionState,
  formData: FormData,
): Promise<SegmentActionState> {
  const name = nameSchema.safeParse(formData.get('name'));
  if (!name.success) return { error: name.error.issues[0]?.message ?? 'Invalid name' };

  const match = String(formData.get('match') ?? 'all') === 'any' ? 'any' : 'all';
  const fields = formData.getAll('rule_field').map(String);
  const operators = formData.getAll('rule_operator').map(String);
  const rawValues = formData.getAll('rule_values').map(String);

  const rules = fields
    .map((field, i) => ({
      field: field as SegmentField,
      operator: (operators[i] ?? 'exists') as SegmentOperator,
      values: (rawValues[i] ?? '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
    }))
    .filter((r) => r.field);

  const parsed = segmentDefinitionSchema.safeParse({ match, rules });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid rule' };

  const current = await getCurrentOrganization();
  const user = await getSessionUser();
  if (!current || !user) return { error: 'No organization found for your account.' };

  const supabase = await createSupabaseServerClient();
  const { data: segment, error: segError } = await supabase
    .from('segments')
    .insert({
      organization_id: current.organization.id,
      name: name.data,
      match_mode: match,
      created_by: user.id,
    })
    .select('id')
    .single();
  if (segError || !segment) return { error: segError?.message ?? 'Could not create the segment.' };

  if (parsed.data.rules.length > 0) {
    const { error: rulesError } = await supabase.from('segment_rules').insert(
      parsed.data.rules.map((r) => ({
        segment_id: segment.id,
        field: r.field,
        operator: r.operator,
        values: r.values,
      })),
    );
    if (rulesError) return { error: rulesError.message };
  }

  revalidatePath('/dashboard/segments');
  return { ok: true };
}
