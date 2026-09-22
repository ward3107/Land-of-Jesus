import { describe, expect, it, vi } from 'vitest';
import { ExpoPushProvider, type ExpoTransport } from './expo';
import { isExpoPushToken, partitionExpoTokens } from './tokens';
import { isPermanentlyInvalid } from './provider';
import type { PushMessage } from './provider';

function msg(token: string): PushMessage {
  return { token, title: 'Daily Message', body: 'Good morning', data: { url: 'communitydirect://messages/1' } };
}

describe('token validation', () => {
  it('recognizes Expo push tokens', () => {
    expect(isExpoPushToken('ExponentPushToken[abc123]')).toBe(true);
    expect(isExpoPushToken('ExpoPushToken[abc123]')).toBe(true);
    expect(isExpoPushToken('not-a-token')).toBe(false);
    expect(isExpoPushToken('fcm:xyz')).toBe(false);
  });

  it('partitions valid vs invalid tokens', () => {
    const { valid, invalid } = partitionExpoTokens([
      'ExponentPushToken[a]',
      'garbage',
      'ExpoPushToken[b]',
    ]);
    expect(valid).toHaveLength(2);
    expect(invalid).toEqual(['garbage']);
  });
});

describe('ExpoPushProvider', () => {
  it('sends via the injected transport and returns ok tickets', async () => {
    const transport: ExpoTransport = vi.fn(async (_endpoint, body) => {
      const items = body as unknown[];
      return { data: items.map((_, i) => ({ status: 'ok' as const, id: `receipt-${i}` })) };
    });
    const provider = new ExpoPushProvider({ transport });
    const result = await provider.send([msg('ExponentPushToken[a]'), msg('ExponentPushToken[b]')]);

    expect(transport).toHaveBeenCalledOnce();
    expect(result.tickets).toHaveLength(2);
    expect(result.tickets.every((t) => t.status === 'ok')).toBe(true);
    expect(result.invalidTokens).toHaveLength(0);
  });

  it('flags DeviceNotRegistered tokens for invalidation', async () => {
    const transport: ExpoTransport = async () => ({
      data: [
        { status: 'ok', id: 'r1' },
        { status: 'error', message: 'gone', details: { error: 'DeviceNotRegistered' } },
      ],
    });
    const provider = new ExpoPushProvider({ transport });
    const result = await provider.send([msg('ExponentPushToken[a]'), msg('ExponentPushToken[b]')]);

    expect(result.invalidTokens).toEqual(['ExponentPushToken[b]']);
    expect(result.tickets[1]?.errorCode).toBe('DeviceNotRegistered');
  });

  it('rejects malformed tokens without calling the transport for them', async () => {
    const transport: ExpoTransport = vi.fn(async (_endpoint, body) => {
      const items = body as unknown[];
      return { data: items.map(() => ({ status: 'ok' as const, id: 'r' })) };
    });
    const provider = new ExpoPushProvider({ transport });
    const result = await provider.send([msg('bad-token'), msg('ExponentPushToken[ok]')]);

    // Only the one valid token is sent to the provider.
    expect((transport as unknown as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);
    expect(result.invalidTokens).toContain('bad-token');
    const okTicket = result.tickets.find((t) => t.token === 'ExponentPushToken[ok]');
    expect(okTicket?.status).toBe('ok');
  });

  it('chunks large sends into provider-sized batches (<=100)', async () => {
    const calls: number[] = [];
    const transport: ExpoTransport = async (_endpoint, body) => {
      const items = body as unknown[];
      calls.push(items.length);
      return { data: items.map(() => ({ status: 'ok' as const, id: 'r' })) };
    };
    const provider = new ExpoPushProvider({ transport });
    const messages = Array.from({ length: 230 }, (_, i) => msg(`ExponentPushToken[${i}]`));
    const result = await provider.send(messages);

    expect(calls).toEqual([100, 100, 30]);
    expect(result.tickets).toHaveLength(230);
  });

  it('adds an Authorization header when an access token is configured', async () => {
    let seenHeaders: Record<string, string> = {};
    const transport: ExpoTransport = async (_endpoint, body, headers) => {
      seenHeaders = headers;
      const items = body as unknown[];
      return { data: items.map(() => ({ status: 'ok' as const, id: 'r' })) };
    };
    const provider = new ExpoPushProvider({ transport, accessToken: 'secret' });
    await provider.send([msg('ExponentPushToken[a]')]);
    expect(seenHeaders.authorization).toBe('Bearer secret');
  });
});

describe('invalidation classification', () => {
  it('treats DeviceNotRegistered and MismatchSenderId as permanent', () => {
    expect(isPermanentlyInvalid('DeviceNotRegistered')).toBe(true);
    expect(isPermanentlyInvalid('MismatchSenderId')).toBe(true);
    expect(isPermanentlyInvalid('MessageRateExceeded')).toBe(false);
    expect(isPermanentlyInvalid(undefined)).toBe(false);
  });
});
