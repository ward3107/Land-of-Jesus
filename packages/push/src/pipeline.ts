/**
 * Delivery pipeline orchestration.
 *
 * This is the heart of the async delivery worker, kept pure and port-based so it
 * runs identically in unit tests (in-memory store + mock provider) and in
 * production (Supabase-backed store + {@link ExpoPushProvider}).
 *
 * Flow (see docs/PUSH-NOTIFICATIONS.md):
 *   audience candidates → segment + notification-preference filter → dedupe →
 *   provider-sized batches → provider.send() → per-recipient attempts →
 *   retry transient failures (backoff) → invalid-token cleanup → finalize job.
 *
 * Guarantees:
 *   - Idempotent: attempts are keyed by deliveryIdempotencyKey(job, device); a
 *     retried job upserts instead of double-sending.
 *   - Vendor-neutral: depends only on {@link NotificationProvider}.
 *   - Deterministic: the clock and sleep are injectable.
 */
import {
  buildDeliveryBatches,
  deliveryIdempotencyKey,
  matchesSegment,
  notificationPreview,
  selectTranslation,
  shouldNotify,
  MAX_PUSH_BATCH_SIZE,
  type DeliveryJobStatus,
  type DeliveryRecipient,
  type DeliveryStatus,
  type Locale,
  type MessageState,
  type MessageTranslation,
  type NotificationPreference,
  type SegmentDefinition,
  type SubscriberProjection,
} from '@communitydirect/core';
import {
  isPermanentlyInvalid,
  type NotificationProvider,
  type PushErrorCode,
  type PushMessage,
  type PushTicket,
} from './provider';

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

/** A candidate recipient with everything needed to decide on and address them. */
export interface AudienceCandidate {
  profileId: string;
  deviceId: string;
  pushToken: string;
  /** Subscriber's preferred locale, for translation routing. */
  locale: string | null;
  /** Org-scoped projection used for segment evaluation. */
  projection: SubscriberProjection;
  /** The subscriber's notification-preference rows (channel/org/master). */
  preferences: NotificationPreference[];
  /** Subscriber's local hour (0–23), for quiet-hours evaluation. */
  localHour: number;
}

/** The message being delivered, denormalized for the worker. */
export interface DeliveryMessage {
  id: string;
  organizationId: string;
  defaultLocale: Locale;
  translations: MessageTranslation[];
  /** Channels the message targets (for channel-scoped prefs + deep link). */
  channelIds: string[];
  /** Saved segment, or null = "all active subscribers of the target channels". */
  segment: SegmentDefinition | null;
  /** Optional link carried in the push data payload. */
  linkUrl: string | null;
}

export interface JobContext {
  jobId: string;
  message: DeliveryMessage;
  candidates: AudienceCandidate[];
}

// ---------------------------------------------------------------------------
// Persistence port (implemented in-memory for tests, over Supabase in prod)
// ---------------------------------------------------------------------------

/** A single per-recipient delivery attempt to persist. */
export interface AttemptRecord {
  jobId: string;
  deviceId: string;
  pushToken: string;
  idempotencyKey: string;
  status: DeliveryStatus;
  providerReceiptId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
}

export interface JobFinalization {
  sent: number;
  failed: number;
  status: DeliveryJobStatus;
  messageState: MessageState;
  error?: string | null;
}

export interface DeliveryPort {
  loadJobContext(jobId: string): Promise<JobContext | null>;
  /** Mark the job PROCESSING and record the resolved audience size. */
  markJobProcessing(jobId: string, audienceSize: number): Promise<void>;
  /** Upsert attempts keyed by idempotency_key (safe to call repeatedly). */
  recordAttempts(attempts: readonly AttemptRecord[]): Promise<void>;
  /** Purge dead push tokens so they are never targeted again. */
  invalidateTokens(tokens: readonly string[]): Promise<void>;
  /** Persist the job's terminal outcome and the message's final state. */
  finalizeJob(jobId: string, result: JobFinalization): Promise<void>;
}

// ---------------------------------------------------------------------------
// Configuration & dependencies
// ---------------------------------------------------------------------------

export interface DeliveryConfig {
  /** Max messages per provider request (clamped to the provider's limit). */
  batchSize: number;
  /** Total attempts for a transiently-failing recipient (>=1). */
  maxAttempts: number;
  /** Base backoff for transient retries; grows exponentially. */
  baseBackoffMs: number;
  /** Minimum gap between provider requests (crude rate control). */
  batchIntervalMs: number;
}

export const DEFAULT_DELIVERY_CONFIG: DeliveryConfig = {
  batchSize: MAX_PUSH_BATCH_SIZE,
  maxAttempts: 3,
  baseBackoffMs: 500,
  batchIntervalMs: 0,
};

export interface DeliveryDeps {
  store: DeliveryPort;
  provider: NotificationProvider;
  now?: () => Date;
  sleep?: (ms: number) => Promise<void>;
  config?: Partial<DeliveryConfig>;
}

export interface DeliveryOutcome {
  jobId: string;
  audienceSize: number;
  sent: number;
  failed: number;
  invalidTokens: string[];
  jobStatus: DeliveryJobStatus;
  messageState: MessageState;
}

// ---------------------------------------------------------------------------
// Pure helpers (independently tested)
// ---------------------------------------------------------------------------

/** Transient provider errors are worth retrying; permanent ones are not. */
export function isTransientError(code: PushErrorCode | undefined): boolean {
  return code === undefined || code === 'MessageRateExceeded' || code === 'Unknown';
}

/** Exponential backoff for retry `attempt` (1-based), capped at 30s. */
export function backoffMs(attempt: number, base: number): number {
  return Math.min(base * 2 ** Math.max(0, attempt - 1), 30_000);
}

/** Message state from delivery counts. Empty audience counts as SENT. */
export function finalMessageState(sent: number, failed: number): MessageState {
  if (failed === 0) return 'SENT';
  if (sent === 0) return 'FAILED';
  return 'PARTIALLY_FAILED';
}

/** Job status from delivery counts. Total failure fails the job. */
export function finalJobStatus(sent: number, failed: number): DeliveryJobStatus {
  return sent === 0 && failed > 0 ? 'FAILED' : 'COMPLETED';
}

interface TicketOutcome {
  status: DeliveryStatus;
  retryable: boolean;
  receiptId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  invalidToken: boolean;
}

/** Classify a provider ticket into a persistable attempt outcome. */
export function ticketOutcome(ticket: PushTicket | undefined): TicketOutcome {
  if (!ticket) {
    // Missing ticket for a sent message: treat as a transient gap, retry.
    return {
      status: 'FAILED',
      retryable: true,
      receiptId: null,
      errorCode: null,
      errorMessage: 'No provider ticket returned',
      invalidToken: false,
    };
  }
  if (ticket.status === 'ok') {
    return {
      status: 'SENT_TO_PROVIDER',
      retryable: false,
      receiptId: ticket.receiptId ?? null,
      errorCode: null,
      errorMessage: null,
      invalidToken: false,
    };
  }
  if (isPermanentlyInvalid(ticket.errorCode)) {
    return {
      status: 'TOKEN_INVALID',
      retryable: false,
      receiptId: null,
      errorCode: ticket.errorCode ?? null,
      errorMessage: ticket.errorMessage ?? null,
      invalidToken: true,
    };
  }
  return {
    status: 'FAILED',
    retryable: isTransientError(ticket.errorCode),
    receiptId: null,
    errorCode: ticket.errorCode ?? null,
    errorMessage: ticket.errorMessage ?? null,
    invalidToken: false,
  };
}

/**
 * Filter candidates through the segment and notification-preference gates, and
 * shape an addressable {@link PushMessage} for each survivor. Reuses the same
 * pure `matchesSegment` / `shouldNotify` / `selectTranslation` used by previews,
 * so delivery never drifts from what the composer showed.
 */
export function resolveRecipients(ctx: JobContext): {
  recipients: DeliveryRecipient[];
  messagesByToken: Map<string, PushMessage>;
  skipped: number;
} {
  const recipients: DeliveryRecipient[] = [];
  const messagesByToken = new Map<string, PushMessage>();
  let skipped = 0;

  for (const c of ctx.candidates) {
    if (!c.projection.active) {
      skipped++;
      continue;
    }
    if (ctx.message.segment && !matchesSegment(ctx.message.segment, c.projection)) {
      skipped++;
      continue;
    }

    // Deliver if any targeted channel the subscriber follows is un-muted.
    const relevant = ctx.message.channelIds.filter((ch) => c.projection.channelIds.includes(ch));
    const channelsToCheck: (string | null)[] = relevant.length > 0 ? relevant : [null];
    const allowed = channelsToCheck.some((channelId) =>
      shouldNotify(c.preferences, {
        organizationId: ctx.message.organizationId,
        channelId,
        localHour: c.localHour,
      }),
    );
    if (!allowed) {
      skipped++;
      continue;
    }

    const translation = selectTranslation(ctx.message, c.locale);
    if (!translation) {
      skipped++;
      continue;
    }

    recipients.push({ jobId: ctx.jobId, deviceId: c.deviceId, pushToken: c.pushToken });
    if (!messagesByToken.has(c.pushToken)) {
      const data: Record<string, unknown> = {
        messageId: ctx.message.id,
        url: `communitydirect://messages/${ctx.message.id}`,
      };
      if (ctx.message.linkUrl) data.link = ctx.message.linkUrl;
      messagesByToken.set(c.pushToken, {
        token: c.pushToken,
        title: translation.title,
        body: notificationPreview(translation),
        data,
      });
    }
  }

  return { recipients, messagesByToken, skipped };
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

const defaultSleep = (ms: number): Promise<void> =>
  ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();

/**
 * Run one delivery job end-to-end. Returns the aggregate outcome. Safe to retry:
 * attempts upsert on their idempotency key, so a re-run never double-sends.
 */
export async function runDeliveryJob(jobId: string, deps: DeliveryDeps): Promise<DeliveryOutcome> {
  const config: DeliveryConfig = { ...DEFAULT_DELIVERY_CONFIG, ...deps.config };
  const sleep = deps.sleep ?? defaultSleep;
  const { store, provider } = deps;

  const ctx = await store.loadJobContext(jobId);
  if (!ctx) {
    return {
      jobId,
      audienceSize: 0,
      sent: 0,
      failed: 0,
      invalidTokens: [],
      jobStatus: 'FAILED',
      messageState: 'FAILED',
    };
  }

  const { recipients, messagesByToken } = resolveRecipients(ctx);
  const batches = buildDeliveryBatches(recipients, config.batchSize);
  const audienceSize = batches.reduce((n, b) => n + b.length, 0);

  await store.markJobProcessing(jobId, audienceSize);

  // Seed PENDING attempts so a crash mid-send is recoverable (idempotent).
  const pendingSeed: AttemptRecord[] = batches.flat().map((r) => ({
    jobId,
    deviceId: r.deviceId,
    pushToken: r.pushToken,
    idempotencyKey: deliveryIdempotencyKey(jobId, r.deviceId),
    status: 'PENDING',
  }));
  if (pendingSeed.length > 0) await store.recordAttempts(pendingSeed);

  const invalidTokens = new Set<string>();
  let sent = 0;
  let failed = 0;

  for (let b = 0; b < batches.length; b++) {
    if (b > 0 && config.batchIntervalMs > 0) await sleep(config.batchIntervalMs);

    let pending = batches[b] ?? [];
    for (let attempt = 1; attempt <= config.maxAttempts && pending.length > 0; attempt++) {
      const messages: PushMessage[] = [];
      for (const r of pending) {
        const msg = messagesByToken.get(r.pushToken);
        if (msg) messages.push(msg);
      }

      const result = await provider.send(messages);
      const ticketByToken = new Map(result.tickets.map((t) => [t.token, t]));

      const finalized: AttemptRecord[] = [];
      const retry: DeliveryRecipient[] = [];
      const lastAttempt = attempt === config.maxAttempts;

      for (const r of pending) {
        const outcome = ticketOutcome(ticketByToken.get(r.pushToken));
        if (outcome.retryable && !lastAttempt) {
          retry.push(r);
          continue;
        }
        if (outcome.invalidToken) invalidTokens.add(r.pushToken);
        if (outcome.status === 'SENT_TO_PROVIDER' || outcome.status === 'DELIVERED') sent++;
        else failed++;
        finalized.push({
          jobId,
          deviceId: r.deviceId,
          pushToken: r.pushToken,
          idempotencyKey: deliveryIdempotencyKey(jobId, r.deviceId),
          status: outcome.status,
          providerReceiptId: outcome.receiptId,
          errorCode: outcome.errorCode,
          errorMessage: outcome.errorMessage,
        });
      }

      if (finalized.length > 0) await store.recordAttempts(finalized);
      pending = retry;
      if (pending.length > 0) await sleep(backoffMs(attempt, config.baseBackoffMs));
    }
  }

  if (invalidTokens.size > 0) await store.invalidateTokens([...invalidTokens]);

  const messageState = finalMessageState(sent, failed);
  const jobStatus = finalJobStatus(sent, failed);
  await store.finalizeJob(jobId, { sent, failed, status: jobStatus, messageState });

  return {
    jobId,
    audienceSize,
    sent,
    failed,
    invalidTokens: [...invalidTokens],
    jobStatus,
    messageState,
  };
}
