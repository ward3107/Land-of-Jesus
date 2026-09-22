import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

/**
 * Request notification permission and return this device's Expo push token, or
 * null if permission was denied. The token is later stored server-side against
 * the user's device (see docs/PUSH-NOTIFICATIONS.md). Permission is always
 * explicit — we never register a token without the user's consent.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') return null;

  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  const projectId = extra?.eas?.projectId;
  const token = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  return token.data;
}
