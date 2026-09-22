/**
 * Service-role Supabase client. This client bypasses RLS, so it is only ever
 * created server-side inside the trusted worker, never shipped to a browser or
 * the mobile app.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@communitydirect/core';
import type { WorkerEnv } from './env';

export type ServiceClient = SupabaseClient<Database>;

export function createServiceClient(env: WorkerEnv): ServiceClient {
  return createClient<Database>(env.supabaseUrl, env.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
