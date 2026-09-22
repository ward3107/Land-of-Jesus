/**
 * Deep-link helpers (pure — no Expo imports, so unit-testable in Node).
 *
 * A push notification carries a deep link like `communitydirect://messages/<uuid>`.
 * Tapping it opens the exact message (spec §22).
 */

export const APP_SCHEME = 'communitydirect';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function buildMessageDeepLink(messageId: string): string {
  return `${APP_SCHEME}://messages/${messageId}`;
}

export function buildJoinDeepLink(code: string): string {
  return `${APP_SCHEME}://join/${code}`;
}

export interface ParsedDeepLink {
  type: 'message' | 'join' | 'unknown';
  id?: string;
}

/** Parse an incoming deep link URL into a route intent. */
export function parseDeepLink(url: string): ParsedDeepLink {
  const withoutScheme = url.replace(new RegExp(`^${APP_SCHEME}://`), '');
  const [segment, value] = withoutScheme.split('/');
  if (segment === 'messages' && value && UUID_RE.test(value)) {
    return { type: 'message', id: value };
  }
  if (segment === 'join' && value) {
    return { type: 'join', id: value };
  }
  return { type: 'unknown' };
}
