/**
 * Device + push-token registration via Supabase. A user may have many devices;
 * each device has one current push token, deduped on (provider, token).
 * See docs/PUSH-NOTIFICATIONS.md. The pure payload shaping lives in
 * ./device-payload (unit-tested).
 */
import { buildDeviceRegistration, type DeviceRegistrationInput } from './device-payload';
import { supabase } from './supabase';

export { buildDeviceRegistration } from './device-payload';
export type { DeviceRegistrationInput } from './device-payload';

/** Upsert the device row and (if present) its push token. */
export async function registerDevice(input: DeviceRegistrationInput): Promise<void> {
  const { device, pushToken } = buildDeviceRegistration(input);

  const { data: deviceRow, error: deviceError } = await supabase
    .from('devices')
    .upsert(device, { onConflict: 'profile_id,install_id' })
    .select('id')
    .single();
  if (deviceError) throw deviceError;

  if (pushToken && deviceRow) {
    const { error: tokenError } = await supabase
      .from('push_tokens')
      .upsert(
        { ...pushToken, device_id: deviceRow.id, is_valid: true },
        { onConflict: 'provider,token' },
      );
    if (tokenError) throw tokenError;
  }
}
