/**
 * Expo push provider.
 *
 * The HTTP transport is injectable so the provider is fully unit-testable
 * without network access, and so the same logic can run behind a proxy or a
 * mock in CI. The default transport uses the global `fetch` (Node 20+/22).
 */
import { chunk, MAX_PUSH_BATCH_SIZE } from '@communitydirect/core';
import {
  isPermanentlyInvalid,
  type NotificationProvider,
  type PushErrorCode,
  type PushMessage,
  type PushTicket,
  type SendResult,
} from './provider';
import { isExpoPushToken } from './tokens';

const EXPO_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

/** Shape of a single ticket in Expo's response. */
interface ExpoTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

interface ExpoResponse {
  data?: ExpoTicket[];
  errors?: { message: string }[];
}

/** Injectable transport: given a request, return the parsed Expo response. */
export type ExpoTransport = (
  endpoint: string,
  body: unknown,
  headers: Record<string, string>,
) => Promise<ExpoResponse>;

export interface ExpoPushProviderOptions {
  accessToken?: string;
  endpoint?: string;
  transport?: ExpoTransport;
}

function mapExpoError(details?: string): PushErrorCode {
  switch (details) {
    case 'DeviceNotRegistered':
      return 'DeviceNotRegistered';
    case 'MessageTooBig':
      return 'MessageTooBig';
    case 'MessageRateExceeded':
      return 'MessageRateExceeded';
    case 'MismatchSenderId':
      return 'MismatchSenderId';
    case 'InvalidCredentials':
      return 'InvalidCredentials';
    default:
      return 'Unknown';
  }
}

const defaultTransport: ExpoTransport = async (endpoint, body, headers) => {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Expo push request failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as ExpoResponse;
};

export class ExpoPushProvider implements NotificationProvider {
  readonly name = 'expo';
  private readonly endpoint: string;
  private readonly transport: ExpoTransport;
  private readonly accessToken?: string;

  constructor(options: ExpoPushProviderOptions = {}) {
    this.endpoint = options.endpoint ?? EXPO_ENDPOINT;
    this.transport = options.transport ?? defaultTransport;
    this.accessToken = options.accessToken;
  }

  async send(messages: readonly PushMessage[]): Promise<SendResult> {
    const tickets: PushTicket[] = [];
    const invalidTokens: string[] = [];

    // Reject malformed tokens up front — never send them to the provider.
    const sendable: PushMessage[] = [];
    for (const m of messages) {
      if (isExpoPushToken(m.token)) {
        sendable.push(m);
      } else {
        tickets.push({ token: m.token, status: 'error', errorCode: 'DeviceNotRegistered' });
        invalidTokens.push(m.token);
      }
    }

    const headers: Record<string, string> = {};
    if (this.accessToken) headers.authorization = `Bearer ${this.accessToken}`;

    for (const batch of chunk(sendable, MAX_PUSH_BATCH_SIZE)) {
      const payload = batch.map((m) => ({
        to: m.token,
        title: m.title,
        body: m.body,
        data: m.data,
        sound: m.sound === undefined ? 'default' : m.sound,
        badge: m.badge,
      }));

      const response = await this.transport(this.endpoint, payload, headers);
      const data = response.data ?? [];

      batch.forEach((m, i) => {
        const t = data[i];
        if (!t || t.status === 'ok') {
          tickets.push({ token: m.token, status: 'ok', receiptId: t?.id });
          return;
        }
        const errorCode = mapExpoError(t.details?.error);
        tickets.push({
          token: m.token,
          status: 'error',
          errorCode,
          errorMessage: t.message,
        });
        if (isPermanentlyInvalid(errorCode)) invalidTokens.push(m.token);
      });
    }

    return { tickets, invalidTokens };
  }
}
