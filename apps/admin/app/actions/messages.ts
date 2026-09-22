'use server';

import { revalidatePath } from 'next/cache';
import {
  computeNextRun,
  notificationPreview,
  selectTranslation,
  SUPPORTED_LOCALES,
  validateMessage,
  zonedWallTimeToUtc,
  type Locale,
  type MessageTranslation,
  type Schedule,
} from '@communitydirect/core';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { getCurrentOrganization } from '@/lib/org';

export interface ComposerActionState {
  error?: string;
  ok?: boolean;
  messageId?: string;
  status?: string;
  testPayload?: { title: string; body: string };
}

type Intent = 'draft' | 'publish' | 'test';
type ScheduleKind = 'now' | 'at' | 'recurring';

function collectTranslations(formData: FormData): MessageTranslation[] {
  const out: MessageTranslation[] = [];
  for (const locale of SUPPORTED_LOCALES) {
    const title = String(formData.get(`title_${locale}`) ?? '').trim();
    const body = String(formData.get(`body_${locale}`) ?? '').trim();
    if (title && body) out.push({ locale, title, body });
  }
  return out;
}

/** "2026-10-01T18:30" (browser wall time) + IANA zone → UTC ISO instant. */
function localDateTimeToUtcIso(value: string, timeZone: string): string | null {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const utc = zonedWallTimeToUtc(
    Number(m[1]),
    Number(m[2]),
    Number(m[3]),
    Number(m[4]),
    Number(m[5]),
    timeZone,
  );
  return utc.toISOString();
}

export async function composeMessage(
  _prev: ComposerActionState,
  formData: FormData,
): Promise<ComposerActionState> {
  const intent = (String(formData.get('intent') ?? 'draft') as Intent) || 'draft';
  const scheduleKind = (String(formData.get('scheduleKind') ?? 'now') as ScheduleKind) || 'now';
  const timeZone = String(formData.get('timeZone') ?? 'UTC') || 'UTC';

  const defaultLocale = String(formData.get('defaultLocale') ?? 'en') as Locale;
  const translations = collectTranslations(formData);
  const channelIds = formData.getAll('channelIds').map(String).filter(Boolean);
  const segmentId = String(formData.get('segmentId') ?? '') || null;
  const linkUrl = String(formData.get('linkUrl') ?? '').trim() || undefined;

  // One-off schedule → concrete UTC instant; recurring is stored separately.
  let scheduledAtIso: string | null = null;
  if (scheduleKind === 'at') {
    const raw = String(formData.get('scheduleAt') ?? '');
    scheduledAtIso = localDateTimeToUtcIso(raw, timeZone);
    if (!scheduledAtIso) return { error: 'Pick a valid date and time to schedule.' };
    if (new Date(scheduledAtIso).getTime() <= Date.now()) {
      return { error: 'Scheduled time must be in the future.' };
    }
  }

  const validation = validateMessage({
    defaultLocale,
    translations,
    channelIds,
    segmentId,
    scheduledAt: scheduledAtIso,
    expiresAt: null,
    ...(linkUrl ? { linkUrl } : {}),
  });
  if (!validation.success || !validation.data) {
    return { error: validation.errors?.[0]?.message ?? 'Please complete the message.' };
  }

  // A dry-run test renders exactly what a subscriber's device would show, using
  // the same selectTranslation/notificationPreview the delivery worker uses.
  if (intent === 'test') {
    const chosen = selectTranslation(validation.data, defaultLocale);
    if (!chosen) return { error: 'Add a language variant to preview.' };
    return { ok: true, testPayload: { title: chosen.title, body: notificationPreview(chosen) } };
  }

  const current = await getCurrentOrganization();
  const user = await getSessionUser();
  if (!current || !user) return { error: 'No organization found for your account.' };
  const supabase = await createSupabaseServerClient();

  const publishState = intent === 'publish' && scheduleKind !== 'now' ? 'SCHEDULED' : 'DRAFT';
  const { data: message, error: insertError } = await supabase
    .from('messages')
    .insert({
      organization_id: current.organization.id,
      default_locale: defaultLocale,
      state: publishState,
      segment_id: segmentId,
      link_url: linkUrl ?? null,
      scheduled_at: scheduleKind === 'at' ? scheduledAtIso : null,
      created_by: user.id,
    })
    .select('id')
    .single();
  if (insertError || !message) return { error: insertError?.message ?? 'Could not save the message.' };

  const [{ error: translationError }, { error: channelError }] = await Promise.all([
    supabase
      .from('message_translations')
      .insert(validation.data.translations.map((t) => ({ message_id: message.id, ...t }))),
    supabase
      .from('message_channels')
      .insert(channelIds.map((channelId) => ({ message_id: message.id, channel_id: channelId }))),
  ]);
  if (translationError || channelError) {
    return { error: (translationError ?? channelError)?.message ?? 'Could not save message content.' };
  }

  if (intent === 'draft') {
    revalidatePath('/dashboard/messages');
    return { ok: true, messageId: message.id, status: 'Draft saved.' };
  }

  // intent === 'publish'
  if (scheduleKind === 'now') {
    const { error: enqueueError } = await supabase.rpc('enqueue_message', { p_message_id: message.id });
    if (enqueueError) return { error: enqueueError.message };
    revalidatePath('/dashboard/messages');
    return { ok: true, messageId: message.id, status: 'Message queued for delivery.' };
  }

  if (scheduleKind === 'recurring') {
    const recurringKind = String(formData.get('recurringKind') ?? 'daily');
    const [hourStr, minuteStr] = String(formData.get('recurringTime') ?? '09:00').split(':');
    const hour = Number(hourStr);
    const minute = Number(minuteStr);
    const weekday = Number(formData.get('recurringWeekday') ?? '1');
    const schedule: Schedule =
      recurringKind === 'weekly'
        ? { kind: 'weekly', timeZone, weekday, hour, minute }
        : { kind: 'daily', timeZone, hour, minute };
    const next = computeNextRun(schedule);
    const { error: schedError } = await supabase.from('scheduled_messages').insert({
      organization_id: current.organization.id,
      message_id: message.id,
      kind: recurringKind === 'weekly' ? 'weekly' : 'daily',
      time_zone: timeZone,
      hour,
      minute,
      weekday: recurringKind === 'weekly' ? weekday : null,
      next_run_at: next ? next.toISOString() : null,
      is_active: true,
    });
    if (schedError) return { error: schedError.message };
    revalidatePath('/dashboard/scheduled');
    return {
      ok: true,
      messageId: message.id,
      status: next ? `Recurring send scheduled — next run ${new Date(next.toISOString()).toUTCString()}.` : 'Recurring send scheduled.',
    };
  }

  // scheduleKind === 'at'
  revalidatePath('/dashboard/scheduled');
  return {
    ok: true,
    messageId: message.id,
    status: scheduledAtIso ? `Scheduled for ${new Date(scheduledAtIso).toUTCString()}.` : 'Scheduled.',
  };
}
