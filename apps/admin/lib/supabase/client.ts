'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@communitydirect/core';
import { getPublicSupabaseConfig } from '../env';

/** Browser Supabase client (anon key). RLS enforces all authorization. */
export function createSupabaseBrowserClient() {
  const { url, anonKey } = getPublicSupabaseConfig();
  return createBrowserClient<Database>(url, anonKey);
}
