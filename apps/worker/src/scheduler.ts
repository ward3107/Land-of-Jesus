/**
 * Scheduler tick. Two responsibilities, both idempotent:
 *   - Promote due one-off SCHEDULED messages to jobs (delegated to the
 *     enqueue_due_scheduled RPC).
 *   - Fire due recurring schedules (daily/weekly), advancing next_run_at with
 *     the DST-correct computeNextRun from @communitydirect/core.
 * Recurring templates stay in the SCHEDULED state and are never frozen, so each
 * fire simply creates a new delivery job keyed by its fire instant.
 */
import { computeNextRun } from '@communitydirect/core';
import type { ServiceClient } from './client';
import { toRecurrence, type ScheduledRow } from './mapping';

export interface SchedulerResult {
  promotedOnce: number;
  firedRecurring: number;
}

export async function runScheduler(sb: ServiceClient, now: Date = new Date()): Promise<SchedulerResult> {
  const { data: promoted } = await sb.rpc('enqueue_due_scheduled', { p_now: now.toISOString() });

  const { data: due } = await sb
    .from('scheduled_messages')
    .select('id, organization_id, message_id, kind, time_zone, run_at, hour, minute, weekday, next_run_at')
    .eq('is_active', true)
    .in('kind', ['daily', 'weekly'])
    .lte('next_run_at', now.toISOString());

  let firedRecurring = 0;
  for (const row of due ?? []) {
    if (!row.next_run_at) continue;
    const idempotencyKey = `sched:${row.id}:at:${row.next_run_at}`;

    await sb
      .from('delivery_jobs')
      .upsert(
        {
          organization_id: row.organization_id,
          message_id: row.message_id,
          idempotency_key: idempotencyKey,
          status: 'PENDING',
        },
        { onConflict: 'idempotency_key', ignoreDuplicates: true },
      );

    const recurrence = toRecurrence(row as ScheduledRow);
    const next = recurrence ? computeNextRun(recurrence, now) : null;
    await sb
      .from('scheduled_messages')
      .update({ next_run_at: next ? next.toISOString() : null, is_active: next != null })
      .eq('id', row.id);

    firedRecurring += 1;
  }

  return { promotedOnce: promoted ?? 0, firedRecurring };
}
