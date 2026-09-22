import { supabase } from './supabase';

/**
 * Ensure the app has a session. Privacy-first & device-first: if there is no
 * session we sign in anonymously so the user can follow organizations without
 * handing over an email (spec §27). They can later link an email/Apple/Google
 * identity to the same account.
 *
 * Returns the profile id, or null if auth is unavailable (offline / not
 * configured).
 */
export async function ensureSession(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) return session.user.id;

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) return null;
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}
