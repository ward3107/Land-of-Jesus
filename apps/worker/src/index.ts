/**
 * CommunityDirect delivery worker CLI.
 *
 *   pnpm --filter @communitydirect/worker start          # one tick, then exit
 *   pnpm --filter @communitydirect/worker start -- --loop # poll forever
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment
 * (never committed — see docs/SECURITY.md).
 */
import { createServiceClient } from './client';
import { loadWorkerEnv } from './env';
import { tick, type TickResult } from './worker';

function log(message: string): void {
  process.stdout.write(`${new Date().toISOString()} ${message}\n`);
}

function summarize(result: TickResult): string {
  const sent = result.outcomes.reduce((n, o) => n + o.sent, 0);
  const failed = result.outcomes.reduce((n, o) => n + o.failed, 0);
  return `promoted=${result.promotedOnce} recurring=${result.firedRecurring} claimed=${result.claimed} sent=${sent} failed=${failed}`;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function main(): Promise<void> {
  const env = loadWorkerEnv();
  const sb = createServiceClient(env);
  const loop = process.argv.includes('--loop');
  const intervalMs = Number(process.env.WORKER_POLL_INTERVAL_MS ?? '5000');

  log('delivery worker starting');
  do {
    try {
      const result = await tick(sb, env);
      log(`tick ${summarize(result)}`);
    } catch (err) {
      log(`tick error: ${err instanceof Error ? err.message : String(err)}`);
    }
    if (loop) await sleep(intervalMs);
  } while (loop);
  log('delivery worker done');
}

main().catch((err) => {
  process.stderr.write(`fatal: ${err instanceof Error ? err.stack : String(err)}\n`);
  process.exitCode = 1;
});
