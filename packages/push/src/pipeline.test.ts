import { describe, expect, it } from 'vitest';
import type {
  NotificationProvider,
  PushMessage,
  PushTicket,
  SendResult,
} from './provider';
import {
  backoffMs,
  finalJobStatus,
  finalMessageState,
  isTransientError,
  resolveRecipients,
  runDeliveryJob,
  ticketOutcome,
  type AudienceCandidate,
  type DeliveryMessage,
  type JobContext,
} from './pipeline';
import { InMemoryDeliveryStore } from './memory-store';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let tokenSeq = 0;
function nextToken(): string {
  tokenSeq += 1;
  return `ExponentPushToken[${String(tokenSeq).padStart(22, 'x')}]`;
}

function candidate(overrides: Partial<AudienceCandidate> = {}): AudienceCandidate {
  const token = overrides.pushToken ?? nextToken();
  const deviceId = overrides.deviceId ?? `dev-${token}`;
  return {
    profileId: overrides.profileId ?? `prof-${deviceId}`,
    deviceId,
    pushToken: token,
    locale: 'en',
    localHour: 12,
    preferences: [],
    projection: {
      id: overrides.profileId ?? `prof-${deviceId}`,
      organizationId: 'org1',
      language: 'en',
      channelIds: ['ch1'],
      location: null,
      tags: [],
      signupSource: null,
      active: true,
    },
    ...overrides,
  };
}

function message(overrides: Partial<DeliveryMessage> = {}): DeliveryMessage {
  return {
    id: 'm1',
    organizationId: 'org1',
    defaultLocale: 'en',
    translations: [{ locale: 'en', title: 'Hello', body: 'Body text' }],
    channelIds: ['ch1'],
    segment: null,
    linkUrl: null,
    ...overrides,
  };
}

function jobContext(candidates: AudienceCandidate[], msg = message()): JobContext {
  return { jobId: 'job1', message: msg, candidates };
}

function okTickets(messages: readonly PushMessage[]): SendResult {
  return {
    tickets: messages.map((m, i) => ({ token: m.token, status: 'ok', receiptId: `r${i}` }) as PushTicket),
    invalidTokens: [],
  };
}

class MockProvider implements NotificationProvider {
  readonly name = 'mock';
  readonly calls: PushMessage[][] = [];
  constructor(
    private readonly handler: (messages: readonly PushMessage[], call: number) => SendResult = okTickets,
  ) {}
  send(messages: readonly PushMessage[]): Promise<SendResult> {
    const call = this.calls.length;
    this.calls.push([...messages]);
    return Promise.resolve(this.handler(messages, call));
  }
}

function silentSleep(record?: number[]) {
  return (ms: number): Promise<void> => {
    record?.push(ms);
    return Promise.resolve();
  };
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

describe('pure helpers', () => {
  it('classifies transient vs permanent errors', () => {
    expect(isTransientError('MessageRateExceeded')).toBe(true);
    expect(isTransientError('Unknown')).toBe(true);
    expect(isTransientError(undefined)).toBe(true);
    expect(isTransientError('MessageTooBig')).toBe(false);
    expect(isTransientError('DeviceNotRegistered')).toBe(false);
    expect(isTransientError('InvalidCredentials')).toBe(false);
  });

  it('backoff grows exponentially and caps', () => {
    expect(backoffMs(1, 500)).toBe(500);
    expect(backoffMs(2, 500)).toBe(1000);
    expect(backoffMs(3, 500)).toBe(2000);
    expect(backoffMs(20, 500)).toBe(30_000);
  });

  it('derives message state from counts', () => {
    expect(finalMessageState(5, 0)).toBe('SENT');
    expect(finalMessageState(0, 0)).toBe('SENT'); // empty audience
    expect(finalMessageState(3, 2)).toBe('PARTIALLY_FAILED');
    expect(finalMessageState(0, 4)).toBe('FAILED');
  });

  it('derives job status from counts', () => {
    expect(finalJobStatus(5, 0)).toBe('COMPLETED');
    expect(finalJobStatus(3, 2)).toBe('COMPLETED');
    expect(finalJobStatus(0, 4)).toBe('FAILED');
    expect(finalJobStatus(0, 0)).toBe('COMPLETED');
  });

  it('maps tickets to outcomes', () => {
    expect(ticketOutcome({ token: 't', status: 'ok', receiptId: 'x' }).status).toBe('SENT_TO_PROVIDER');
    const invalid = ticketOutcome({ token: 't', status: 'error', errorCode: 'DeviceNotRegistered' });
    expect(invalid.status).toBe('TOKEN_INVALID');
    expect(invalid.invalidToken).toBe(true);
    const rate = ticketOutcome({ token: 't', status: 'error', errorCode: 'MessageRateExceeded' });
    expect(rate.status).toBe('FAILED');
    expect(rate.retryable).toBe(true);
    const big = ticketOutcome({ token: 't', status: 'error', errorCode: 'MessageTooBig' });
    expect(big.retryable).toBe(false);
    expect(ticketOutcome(undefined).retryable).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// resolveRecipients (segment + prefs gating, dedupe, translation routing)
// ---------------------------------------------------------------------------

describe('resolveRecipients', () => {
  it('addresses each survivor with the right translation and deep link', () => {
    const ar = candidate({ locale: 'ar' });
    const msg = message({
      translations: [
        { locale: 'en', title: 'Hello', body: 'Hi' },
        { locale: 'ar', title: 'مرحبا', body: 'أهلا' },
      ],
      linkUrl: 'https://example.org/x',
    });
    const { recipients, messagesByToken } = resolveRecipients(jobContext([ar], msg));
    expect(recipients).toHaveLength(1);
    const push = messagesByToken.get(ar.pushToken);
    expect(push?.title).toBe('مرحبا');
    expect(push?.data).toMatchObject({ messageId: 'm1', url: 'communitydirect://messages/m1', link: 'https://example.org/x' });
  });

  it('drops candidates outside the segment', () => {
    const seg = { match: 'all' as const, rules: [{ field: 'language' as const, operator: 'eq' as const, values: ['he'] }] };
    const en = candidate({ locale: 'en' });
    const he = candidate({ locale: 'he', projection: { ...candidate().projection, language: 'he' } });
    const { recipients, skipped } = resolveRecipients(jobContext([en, he], message({ segment: seg })));
    expect(recipients).toHaveLength(1);
    expect(skipped).toBe(1);
  });

  it('drops muted subscribers and respects quiet hours', () => {
    const muted = candidate({
      preferences: [{ organizationId: 'org1', channelId: null, notificationsEnabled: false, quietHoursStart: null, quietHoursEnd: null }],
    });
    const quiet = candidate({
      localHour: 23,
      preferences: [{ organizationId: 'org1', channelId: null, notificationsEnabled: true, quietHoursStart: 22, quietHoursEnd: 7 }],
    });
    const awake = candidate({ localHour: 12 });
    const { recipients } = resolveRecipients(jobContext([muted, quiet, awake]));
    expect(recipients).toHaveLength(1);
    expect(recipients[0]?.pushToken).toBe(awake.pushToken);
  });

  it('drops inactive followers', () => {
    const inactive = candidate({ projection: { ...candidate().projection, active: false } });
    const { recipients, skipped } = resolveRecipients(jobContext([inactive]));
    expect(recipients).toHaveLength(0);
    expect(skipped).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// runDeliveryJob (end to end over the in-memory store)
// ---------------------------------------------------------------------------

describe('runDeliveryJob', () => {
  it('delivers to everyone on the happy path and marks the message SENT', async () => {
    const store = new InMemoryDeliveryStore([jobContext([candidate(), candidate(), candidate()])]);
    const provider = new MockProvider();
    const outcome = await runDeliveryJob('job1', { store, provider, sleep: silentSleep() });

    expect(outcome.audienceSize).toBe(3);
    expect(outcome.sent).toBe(3);
    expect(outcome.failed).toBe(0);
    expect(outcome.messageState).toBe('SENT');
    expect(outcome.jobStatus).toBe('COMPLETED');
    expect(provider.calls).toHaveLength(1);
    expect(store.attemptsWithStatus('SENT_TO_PROVIDER')).toHaveLength(3);
    expect(store.jobs.get('job1')?.finalization?.messageState).toBe('SENT');
  });

  it('de-duplicates a shared token across two device rows', async () => {
    const token = nextToken();
    const a = candidate({ deviceId: 'devA', pushToken: token });
    const b = candidate({ deviceId: 'devB', pushToken: token });
    const store = new InMemoryDeliveryStore([jobContext([a, b])]);
    const provider = new MockProvider();
    const outcome = await runDeliveryJob('job1', { store, provider, sleep: silentSleep() });
    expect(outcome.audienceSize).toBe(1);
    expect(provider.calls[0]).toHaveLength(1);
  });

  it('cleans up invalid tokens and reports a partial failure', async () => {
    const good = candidate();
    const dead = candidate();
    const store = new InMemoryDeliveryStore([jobContext([good, dead])]);
    const provider = new MockProvider((messages) => ({
      tickets: messages.map((m) =>
        m.token === dead.pushToken
          ? ({ token: m.token, status: 'error', errorCode: 'DeviceNotRegistered' } as PushTicket)
          : ({ token: m.token, status: 'ok', receiptId: 'r' } as PushTicket),
      ),
      invalidTokens: [],
    }));

    const outcome = await runDeliveryJob('job1', { store, provider, sleep: silentSleep() });
    expect(outcome.sent).toBe(1);
    expect(outcome.failed).toBe(1);
    expect(outcome.messageState).toBe('PARTIALLY_FAILED');
    expect(outcome.invalidTokens).toEqual([dead.pushToken]);
    expect(store.invalidatedTokens.has(dead.pushToken)).toBe(true);
    expect(store.attemptsWithStatus('TOKEN_INVALID')).toHaveLength(1);
  });

  it('retries transient failures with backoff, then succeeds', async () => {
    const c = candidate();
    const store = new InMemoryDeliveryStore([jobContext([c])]);
    const sleeps: number[] = [];
    const provider = new MockProvider((messages, call) =>
      call === 0
        ? { tickets: messages.map((m) => ({ token: m.token, status: 'error', errorCode: 'MessageRateExceeded' }) as PushTicket), invalidTokens: [] }
        : okTickets(messages),
    );

    const outcome = await runDeliveryJob('job1', {
      store,
      provider,
      sleep: silentSleep(sleeps),
      config: { baseBackoffMs: 100 },
    });

    expect(provider.calls).toHaveLength(2);
    expect(outcome.sent).toBe(1);
    expect(outcome.messageState).toBe('SENT');
    expect(sleeps).toContain(100); // backoff after the first transient failure
  });

  it('gives up after maxAttempts and fails the recipient', async () => {
    const c = candidate();
    const store = new InMemoryDeliveryStore([jobContext([c])]);
    const provider = new MockProvider((messages) => ({
      tickets: messages.map((m) => ({ token: m.token, status: 'error', errorCode: 'MessageRateExceeded' }) as PushTicket),
      invalidTokens: [],
    }));
    const outcome = await runDeliveryJob('job1', {
      store,
      provider,
      sleep: silentSleep(),
      config: { maxAttempts: 2, baseBackoffMs: 1 },
    });
    expect(provider.calls).toHaveLength(2);
    expect(outcome.sent).toBe(0);
    expect(outcome.failed).toBe(1);
    expect(outcome.jobStatus).toBe('FAILED');
    expect(outcome.messageState).toBe('FAILED');
  });

  it('rate-controls between batches', async () => {
    const store = new InMemoryDeliveryStore([jobContext([candidate(), candidate()])]);
    const provider = new MockProvider();
    const sleeps: number[] = [];
    await runDeliveryJob('job1', {
      store,
      provider,
      sleep: silentSleep(sleeps),
      config: { batchSize: 1, batchIntervalMs: 250 },
    });
    expect(provider.calls).toHaveLength(2); // one recipient per batch
    expect(sleeps).toContain(250);
  });

  it('handles an empty audience as a no-op SENT', async () => {
    const muted = candidate({
      preferences: [{ organizationId: 'org1', channelId: null, notificationsEnabled: false, quietHoursStart: null, quietHoursEnd: null }],
    });
    const store = new InMemoryDeliveryStore([jobContext([muted])]);
    const provider = new MockProvider();
    const outcome = await runDeliveryJob('job1', { store, provider, sleep: silentSleep() });
    expect(outcome.audienceSize).toBe(0);
    expect(provider.calls).toHaveLength(0);
    expect(outcome.messageState).toBe('SENT');
    expect(outcome.jobStatus).toBe('COMPLETED');
  });

  it('is idempotent across re-runs (attempts upsert, no duplicates)', async () => {
    const store = new InMemoryDeliveryStore([jobContext([candidate(), candidate()])]);
    const provider = new MockProvider();
    await runDeliveryJob('job1', { store, provider, sleep: silentSleep() });
    const first = store.attempts.size;
    await runDeliveryJob('job1', { store, provider, sleep: silentSleep() });
    expect(store.attempts.size).toBe(first); // same idempotency keys, no growth
    expect(store.attemptsWithStatus('SENT_TO_PROVIDER')).toHaveLength(2);
  });

  it('fails cleanly when the job context is missing', async () => {
    const store = new InMemoryDeliveryStore([]);
    const provider = new MockProvider();
    const outcome = await runDeliveryJob('ghost', { store, provider, sleep: silentSleep() });
    expect(outcome.jobStatus).toBe('FAILED');
    expect(provider.calls).toHaveLength(0);
  });
});
