/**
 * One worker tick: advance the schedule, lease pending jobs, deliver each.
 * Safe to run concurrently (jobs are leased with FOR UPDATE SKIP LOCKED) and
 * safe to re-run (delivery attempts are idempotent).
 */
import { runDeliveryJob, ExpoPushProvider, type DeliveryOutcome } from '@communitydirect/push';
import type { ServiceClient } from './client';
import type { WorkerEnv } from './env';
import { runScheduler } from './scheduler';
import { SupabaseDeliveryStore } from './store';

export interface TickResult {
  promotedOnce: number;
  firedRecurring: number;
  claimed: number;
  outcomes: DeliveryOutcome[];
}

export async function tick(sb: ServiceClient, env: WorkerEnv): Promise<TickResult> {
  const schedule = await runScheduler(sb);

  const { data: claimed, error } = await sb.rpc('claim_delivery_jobs', { p_limit: env.batchLimit });
  if (error) throw error;
  const jobs = claimed ?? [];

  const store = new SupabaseDeliveryStore(sb);
  const provider = new ExpoPushProvider({ accessToken: env.expoAccessToken });

  const outcomes: DeliveryOutcome[] = [];
  for (const job of jobs) {
    const outcome = await runDeliveryJob(job.id, {
      store,
      provider,
      config: { batchIntervalMs: env.batchIntervalMs },
    });
    outcomes.push(outcome);
  }

  return {
    promotedOnce: schedule.promotedOnce,
    firedRecurring: schedule.firedRecurring,
    claimed: jobs.length,
    outcomes,
  };
}
