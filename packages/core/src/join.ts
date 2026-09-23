/**
 * Join links & signup-source attribution (shared by the admin, web landing page
 * and mobile deep-link handler so the attribution string never drifts).
 *
 * A join link has a short code and an optional campaign label. When someone
 * follows through it, we record where they came from as the follower's
 * `signup_source` — a low-sensitivity attribution tag, never behavioral
 * profiling (see docs/PRIVACY.md).
 */

/** Mirrors the join_links.code CHECK: ^[A-Za-z0-9_-]{4,40}$ */
export const JOIN_CODE_RE = /^[A-Za-z0-9_-]{4,40}$/;

export function isValidJoinCode(code: string): boolean {
  return JOIN_CODE_RE.test(code);
}

/**
 * The attribution tag stored on a follow made through a join link. Prefer the
 * human-readable campaign when present (e.g. "qr:whatsapp-migration"), else fall
 * back to the opaque code ("join:aB3xYz"). Segments can then target it via the
 * `signup_source` field.
 */
export function signupSourceFromJoin(code: string, campaign?: string | null): string {
  const trimmed = campaign?.trim();
  return trimmed ? `qr:${trimmed}` : `join:${code}`;
}

/** Web landing path for a join code, e.g. "/join/aB3xYz". */
export function joinLandingPath(code: string): string {
  return `/join/${code}`;
}

/** Absolute web landing URL for a join code, given the admin origin. */
export function joinLandingUrl(origin: string, code: string): string {
  return `${origin.replace(/\/+$/, '')}${joinLandingPath(code)}`;
}
