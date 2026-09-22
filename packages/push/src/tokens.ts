/**
 * Push token validation. Expo tokens look like:
 *   ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
 *   ExpoPushToken[xxxxxxxxxxxxxxxxxxxxxx]
 */

const EXPO_TOKEN_RE = /^Expo(?:nent)?PushToken\[[^\]]+\]$/;

export function isExpoPushToken(token: string): boolean {
  return EXPO_TOKEN_RE.test(token);
}

/** Partition tokens into valid Expo tokens and rejects (kept for logging). */
export function partitionExpoTokens(tokens: readonly string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const t of tokens) (isExpoPushToken(t) ? valid : invalid).push(t);
  return { valid, invalid };
}
