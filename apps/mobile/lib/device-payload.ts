/**
 * Pure device/push-token payload shaping (no Expo/Supabase imports, so it is
 * unit-testable under Node). `registerDevice` in ./device consumes these.
 */
import type { PushPlatform } from '@communitydirect/core';

export interface DeviceRegistrationInput {
  profileId: string;
  installId: string;
  platform: PushPlatform;
  appVersion?: string | null;
  locale?: string | null;
  pushToken?: string | null;
  provider?: string;
}

export interface DeviceInsert {
  profile_id: string;
  install_id: string;
  platform: PushPlatform;
  app_version: string | null;
  locale: string | null;
}

export interface PushTokenInsert {
  profile_id: string;
  provider: string;
  token: string;
}

export function buildDeviceRegistration(input: DeviceRegistrationInput): {
  device: DeviceInsert;
  pushToken: PushTokenInsert | null;
} {
  const device: DeviceInsert = {
    profile_id: input.profileId,
    install_id: input.installId,
    platform: input.platform,
    app_version: input.appVersion ?? null,
    locale: input.locale ?? null,
  };
  const pushToken: PushTokenInsert | null = input.pushToken
    ? { profile_id: input.profileId, provider: input.provider ?? 'expo', token: input.pushToken }
    : null;
  return { device, pushToken };
}
