/**
 * In-memory {@link DeliveryPort}. Backs the pipeline unit tests and documents
 * exactly what a real (Supabase-backed) store must do. Attempts are keyed by
 * idempotency_key so recording twice updates rather than duplicates — the same
 * exactly-once guarantee the database's UNIQUE constraint provides.
 */
import type {
  AttemptRecord,
  DeliveryPort,
  JobContext,
  JobFinalization,
} from './pipeline';

export interface StoredJob {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  audienceSize: number | null;
  finalization: JobFinalization | null;
}

export class InMemoryDeliveryStore implements DeliveryPort {
  private readonly contexts: Map<string, JobContext>;
  /** Latest attempt per idempotency key (upsert semantics). */
  readonly attempts = new Map<string, AttemptRecord>();
  readonly invalidatedTokens = new Set<string>();
  readonly jobs = new Map<string, StoredJob>();

  constructor(contexts: JobContext[] = []) {
    this.contexts = new Map(contexts.map((c) => [c.jobId, c]));
  }

  addContext(context: JobContext): void {
    this.contexts.set(context.jobId, context);
  }

  loadJobContext(jobId: string): Promise<JobContext | null> {
    return Promise.resolve(this.contexts.get(jobId) ?? null);
  }

  markJobProcessing(jobId: string, audienceSize: number): Promise<void> {
    this.jobs.set(jobId, { status: 'PROCESSING', audienceSize, finalization: null });
    return Promise.resolve();
  }

  recordAttempts(attempts: readonly AttemptRecord[]): Promise<void> {
    for (const a of attempts) this.attempts.set(a.idempotencyKey, { ...a });
    return Promise.resolve();
  }

  invalidateTokens(tokens: readonly string[]): Promise<void> {
    for (const t of tokens) this.invalidatedTokens.add(t);
    return Promise.resolve();
  }

  finalizeJob(jobId: string, result: JobFinalization): Promise<void> {
    const existing = this.jobs.get(jobId);
    this.jobs.set(jobId, {
      status: result.status === 'FAILED' ? 'FAILED' : 'COMPLETED',
      audienceSize: existing?.audienceSize ?? null,
      finalization: result,
    });
    return Promise.resolve();
  }

  /** Convenience: all recorded attempts with a given status. */
  attemptsWithStatus(status: AttemptRecord['status']): AttemptRecord[] {
    return [...this.attempts.values()].filter((a) => a.status === status);
  }
}
