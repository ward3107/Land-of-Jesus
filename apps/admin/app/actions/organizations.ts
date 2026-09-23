'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { slugify, SUPPORTED_LOCALES } from '@communitydirect/core';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentOrganization } from '@/lib/org';

const onboardingSchema = z.object({
  name: z.string().trim().min(1, 'Organization name is required').max(120),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9][a-z0-9-]{1,60}$/, 'Handle must be 2–61 chars: a–z, 0–9, hyphen')
    .optional(),
  description: z.string().trim().max(1000).optional(),
  category: z.string().trim().max(80).optional(),
  country: z.string().trim().length(2, 'Use a 2-letter country code').optional().or(z.literal('')),
  defaultLocale: z.enum(SUPPORTED_LOCALES),
});

export interface OnboardingState {
  error?: string;
}

export async function createOrganization(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const raw = {
    name: formData.get('name'),
    slug: (formData.get('slug') as string)?.trim() || undefined,
    description: (formData.get('description') as string) || undefined,
    category: (formData.get('category') as string) || undefined,
    country: (formData.get('country') as string) || undefined,
    defaultLocale: formData.get('defaultLocale'),
  };
  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const { name, description, category, country, defaultLocale } = parsed.data;
  const slug = parsed.data.slug ?? slugify(name);
  if (!slug) {
    return { error: 'Could not derive a handle from the name — please set one.' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('create_organization', {
    p_name: name,
    p_slug: slug,
    p_description: description ?? null,
    p_category: category ?? null,
    p_country: country ? country : null,
    p_default_locale: defaultLocale,
  });

  if (error) {
    if (error.code === '23505') return { error: `The handle "${slug}" is already taken.` };
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export interface VerificationState {
  error?: string;
  ok?: boolean;
}

/** Owner requests platform verification for their organization (→ PENDING). */
export async function requestVerification(
  _prev: VerificationState,
  _formData: FormData,
): Promise<VerificationState> {
  const current = await getCurrentOrganization();
  if (!current) return { error: 'No organization found for your account.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('request_verification', {
    p_org: current.organization.id,
  });
  if (error) return { error: error.message };

  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard');
  return { ok: true };
}
