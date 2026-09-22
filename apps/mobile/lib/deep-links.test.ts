import { describe, expect, it } from 'vitest';
import { buildJoinDeepLink, buildMessageDeepLink, parseDeepLink } from './deep-links';

describe('deep links', () => {
  const uuid = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';

  it('builds message and join links with the app scheme', () => {
    expect(buildMessageDeepLink(uuid)).toBe(`communitydirect://messages/${uuid}`);
    expect(buildJoinDeepLink('abc123')).toBe('communitydirect://join/abc123');
  });

  it('round-trips a message deep link', () => {
    const parsed = parseDeepLink(buildMessageDeepLink(uuid));
    expect(parsed).toEqual({ type: 'message', id: uuid });
  });

  it('parses a join deep link', () => {
    expect(parseDeepLink('communitydirect://join/campaign-a')).toEqual({
      type: 'join',
      id: 'campaign-a',
    });
  });

  it('rejects a malformed message id', () => {
    expect(parseDeepLink('communitydirect://messages/not-a-uuid')).toEqual({ type: 'unknown' });
  });

  it('returns unknown for unrecognized links', () => {
    expect(parseDeepLink('communitydirect://settings')).toEqual({ type: 'unknown' });
  });
});
