/**
 * Worker configuration from the environment. The service-role key is a powerful
 * secret (it bypasses RLS), so it lives only in the deployment environment and
 * is NEVER committed. See docs/SECURITY.md.
 */
export interface WorkerEnv {
  supabaseUrl: string;
  serviceRoleKey: string;
  expoAccessToken?: string;
  /** How many jobs to lease per tick. */
  batchLimit: number;
  /** Rate control: minimum gap between provider requests, ms. */
  batchIntervalMs: number;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function loadWorkerEnv(): WorkerEnv {
  return {
    supabaseUrl: required('SUPABASE_URL'),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
    expoAccessToken: process.env.EXPO_ACCESS_TOKEN || undefined,
    batchLimit: Number(process.env.WORKER_BATCH_LIMIT ?? '20'),
    batchIntervalMs: Number(process.env.WORKER_BATCH_INTERVAL_MS ?? '200'),
  };
}
