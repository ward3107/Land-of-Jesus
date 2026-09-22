/**
 * Vendor-neutral push provider abstraction.
 *
 * Business logic depends on {@link NotificationProvider}, never on a concrete
 * vendor. The MVP ships {@link ExpoPushProvider}; FCM/APNs/OneSignal can be
 * added later by implementing this same interface (see docs/PUSH-NOTIFICATIONS.md).
 */

export interface PushMessage {
  /** Provider push token (e.g. an Expo push token). */
  token: string;
  title: string;
  body: string;
  /** Deep-link + routing payload, e.g. { url: "communitydirect://messages/<uuid>" }. */
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  /** Badge count for iOS, if desired. */
  badge?: number;
}

export type PushErrorCode =
  | 'DeviceNotRegistered'
  | 'MessageTooBig'
  | 'MessageRateExceeded'
  | 'MismatchSenderId'
  | 'InvalidCredentials'
  | 'Unknown';

export interface PushTicket {
  token: string;
  status: 'ok' | 'error';
  /** Provider receipt id, when the message was accepted. */
  receiptId?: string;
  errorCode?: PushErrorCode;
  errorMessage?: string;
}

export interface SendResult {
  tickets: PushTicket[];
  /**
   * Tokens the provider reported as permanently invalid (e.g. the app was
   * uninstalled). The delivery worker must invalidate these so they are never
   * targeted again (see docs/PUSH-NOTIFICATIONS.md §Token hygiene).
   */
  invalidTokens: string[];
}

export interface NotificationProvider {
  readonly name: string;
  /** Send a batch of messages and return per-message tickets. */
  send(messages: readonly PushMessage[]): Promise<SendResult>;
}

/** Error codes that mean a token is dead and should be purged. */
export const PERMANENTLY_INVALID_CODES: readonly PushErrorCode[] = [
  'DeviceNotRegistered',
  'MismatchSenderId',
];

export function isPermanentlyInvalid(code: PushErrorCode | undefined): boolean {
  return code !== undefined && PERMANENTLY_INVALID_CODES.includes(code);
}
