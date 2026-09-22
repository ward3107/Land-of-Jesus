'use client';

import { createBrowserClient } from '@supabase/ssr';
import { getPublicSupabaseConfig } from '../env';

/** Browser Supabase client (anon key). RLS enforces all authorization. */
export function createSupabaseBrowserClient() {
  const { url, anonKey } = getPublicSupabaseConfig();
  return createBrowserClient(url, anonKey);
}
