import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from './supabase/server';

export interface SessionUser {
  id: string;
  email: string | null;
}

/** The current authenticated user, or null. Never throws. */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return { id: user.id, email: user.email ?? null };
  } catch {
    return null;
  }
}

/** Require a session or redirect to /login. */
export async function requireUser(nextPath = '/dashboard'): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}
