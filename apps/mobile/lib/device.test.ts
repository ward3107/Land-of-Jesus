import { describe, expect, it } from 'vitest';
import { buildDeviceRegistration } from './device-payload';

describe('buildDeviceRegistration', () => {
  it('builds a device row and a push token row', () => {
    const { device, pushToken } = buildDeviceRegistration({
      profileId: 'p1',
      installId: 'install-abc',
      platform: 'ios',
      appVersion: '0.1.0',
      locale: 'ar',
      pushToken: 'ExponentPushToken[xyz]',
    });
    expect(device).toEqual({
      profile_id: 'p1',
      install_id: 'install-abc',
      platform: 'ios',
      app_version: '0.1.0',
      locale: 'ar',
    });
    expect(pushToken).toEqual({ profile_id: 'p1', provider: 'expo', token: 'ExponentPushToken[xyz]' });
  });

  it('omits the push token when none is provided', () => {
    const { pushToken } = buildDeviceRegistration({
      profileId: 'p1',
      installId: 'install-abc',
      platform: 'android',
    });
    expect(pushToken).toBeNull();
  });

  it('defaults nullable fields', () => {
    const { device } = buildDeviceRegistration({
      profileId: 'p1',
      installId: 'i',
      platform: 'web',
    });
    expect(device.app_version).toBeNull();
    expect(device.locale).toBeNull();
  });
});
