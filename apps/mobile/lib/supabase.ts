import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';

/**
 * Mobile Supabase client (anon key). Values come from EXPO_PUBLIC_* env vars or
 * the app config `extra`. RLS enforces all authorization server-side.
 */
function resolveConfig(): { url: string; anonKey: string } {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;
  return {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.supabaseUrl ?? 'http://localhost:54321',
    anonKey:
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
      extra.supabaseAnonKey ??
      'public-anon-key-placeholder',
  };
}

const { url, anonKey } = resolveConfig();

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
