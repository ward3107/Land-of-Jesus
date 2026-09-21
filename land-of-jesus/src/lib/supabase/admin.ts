import { createClient } from '@supabase/supabase-js';

/**
 * Admin/Service Role Supabase Client
 * 
 * WARNING: This client bypasses Row Level Security (RLS) policies.
 * 
 * ONLY use this for:
 * - Trusted backend operations that require elevated privileges
 * - Administrative tasks explicitly requiring service role access
 * - System-level data migrations
 * 
 * NEVER use this client in:
 * - Regular user request handlers
 * - Client-side code
 * - Any operation that should respect user permissions
 * 
 * Always ensure proper authorization checks before using this client.
 */
export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required for admin client'
    );
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
