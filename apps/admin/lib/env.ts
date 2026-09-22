/**
 * Environment access. Only NEXT_PUBLIC_* values are client-safe. The service
 * role key is read here but must NEVER be imported into a client component.
 */

export function getPublicSupabaseConfig(): { url: string; anonKey: string } {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'public-anon-key-placeholder',
  };
}

/** Server-only. Throws if called from a client bundle context. */
export function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set (server-only)');
  }
  return key;
}
