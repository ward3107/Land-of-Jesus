import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getPublicSupabaseConfig } from '../env';

/**
 * Server-side Supabase client bound to the request cookies. Uses the anon key;
 * all access is still gated by RLS based on the authenticated user's JWT.
 */
export async function createSupabaseServerClient() {
  const { url, anonKey } = getPublicSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component where cookies are read-only — safe to ignore.
        }
      },
    },
  });
}
