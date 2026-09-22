/**
 * Supabase-backed {@link DeliveryPort}. Runs as service_role, so it reads across
 * tenants to resolve an audience and writes attempts/jobs the RLS-scoped app
 * clients cannot. The pure orchestration lives in @communitydirect/push; this
 * file is only the data plumbing (mirrors InMemoryDeliveryStore's contract).
 */
import type {
  Locale,
  MessageTranslation,
  NotificationPreference,
  SegmentDefinition,
} from '@communitydirect/core';
import type {
  AttemptRecord,
  AudienceCandidate,
  DeliveryPort,
  JobContext,
  JobFinalization,
} from '@communitydirect/push';
import type { ServiceClient } from './client';
import {
  groupPreferences,
  toCandidate,
  toSegmentDefinition,
  type AudienceRow,
  type PreferenceRow,
} from './mapping';

export interface StoreOptions {
  /** Subscriber local hour for quiet-hours evaluation (UTC-based for the MVP). */
  now?: () => Date;
}

export class SupabaseDeliveryStore implements DeliveryPort {
  private readonly orgByJob = new Map<string, string>();
  private readonly now: () => Date;

  constructor(
    private readonly sb: ServiceClient,
    options: StoreOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
  }

  async loadJobContext(jobId: string): Promise<JobContext | null> {
    const { data: job } = await this.sb
      .from('delivery_jobs')
      .select('id, message_id, organization_id')
      .eq('id', jobId)
      .maybeSingle();
    if (!job) return null;
    this.orgByJob.set(jobId, job.organization_id);

    const { data: msg } = await this.sb
      .from('messages')
      .select('id, default_locale, link_url, segment_id')
      .eq('id', job.message_id)
      .maybeSingle();
    if (!msg) return null;

    const [{ data: translations }, { data: channels }] = await Promise.all([
      this.sb.from('message_translations').select('locale, title, body').eq('message_id', msg.id),
      this.sb.from('message_channels').select('channel_id').eq('message_id', msg.id),
    ]);

    let segment: SegmentDefinition | null = null;
    if (msg.segment_id) {
      const [{ data: seg }, { data: rules }] = await Promise.all([
        this.sb.from('segments').select('match_mode').eq('id', msg.segment_id).maybeSingle(),
        this.sb.from('segment_rules').select('field, operator, values').eq('segment_id', msg.segment_id),
      ]);
      if (seg) segment = toSegmentDefinition(seg.match_mode, rules ?? []);
    }

    const { data: audience } = await this.sb.rpc('resolve_delivery_audience', { p_job_id: jobId });
    const rows = (audience ?? []) as AudienceRow[];
    const profileIds = [...new Set(rows.map((r) => r.profile_id))];
    const prefsByProfile = await this.loadPreferences(job.organization_id, profileIds);
    const localHour = this.now().getUTCHours();

    const candidates: AudienceCandidate[] = rows.map((r) =>
      toCandidate(r, prefsByProfile.get(r.profile_id) ?? [], localHour, job.organization_id),
    );

    const messageTranslations: MessageTranslation[] = (translations ?? []).map((t) => ({
      locale: t.locale as Locale,
      title: t.title,
      body: t.body,
    }));

    return {
      jobId,
      message: {
        id: msg.id,
        organizationId: job.organization_id,
        defaultLocale: msg.default_locale as Locale,
        translations: messageTranslations,
        channelIds: (channels ?? []).map((c) => c.channel_id),
        segment,
        linkUrl: msg.link_url,
      },
      candidates,
    };
  }

  private async loadPreferences(
    organizationId: string,
    profileIds: string[],
  ): Promise<Map<string, NotificationPreference[]>> {
    if (profileIds.length === 0) return new Map();
    const { data } = await this.sb
      .from('notification_preferences')
      .select('profile_id, organization_id, channel_id, notifications_enabled, quiet_hours_start, quiet_hours_end')
      .in('profile_id', profileIds)
      .or(`organization_id.eq.${organizationId},organization_id.is.null`);
    return groupPreferences((data ?? []) as PreferenceRow[]);
  }

  async markJobProcessing(jobId: string, audienceSize: number): Promise<void> {
    await this.sb
      .from('delivery_jobs')
      .update({ status: 'PROCESSING', audience_size: audienceSize })
      .eq('id', jobId);
  }

  async recordAttempts(attempts: readonly AttemptRecord[]): Promise<void> {
    if (attempts.length === 0) return;
    const organizationId = await this.orgFor(attempts[0]!.jobId);
    const rows = attempts.map((a) => ({
      job_id: a.jobId,
      organization_id: organizationId,
      device_id: a.deviceId,
      push_token: a.pushToken,
      idempotency_key: a.idempotencyKey,
      status: a.status,
      provider_receipt_id: a.providerReceiptId ?? null,
      error_code: a.errorCode ?? null,
      error_message: a.errorMessage ?? null,
    }));
    await this.sb.from('delivery_attempts').upsert(rows, { onConflict: 'idempotency_key' });
  }

  async invalidateTokens(tokens: readonly string[]): Promise<void> {
    if (tokens.length === 0) return;
    await this.sb
      .from('push_tokens')
      .update({
        is_valid: false,
        invalidated_at: this.now().toISOString(),
        invalidation_reason: 'provider_reported_invalid',
      })
      .in('token', [...tokens]);
  }

  async finalizeJob(jobId: string, result: JobFinalization): Promise<void> {
    await this.sb.rpc('finalize_delivery_job', {
      p_job_id: jobId,
      p_sent: result.sent,
      p_failed: result.failed,
      p_status: result.status,
      p_message_state: result.messageState,
    });
  }

  private async orgFor(jobId: string): Promise<string> {
    const cached = this.orgByJob.get(jobId);
    if (cached) return cached;
    const { data } = await this.sb
      .from('delivery_jobs')
      .select('organization_id')
      .eq('id', jobId)
      .maybeSingle();
    const org = data?.organization_id ?? '';
    this.orgByJob.set(jobId, org);
    return org;
  }
}
