import { describe, expect, it } from 'vitest';
import {
  inQuietWindow,
  shouldNotify,
  type NotificationPreference,
  type NotificationTarget,
} from './notifications';

const org = 'org-1';
const chan = 'chan-1';
const target: NotificationTarget = { organizationId: org, channelId: chan, localHour: 9 };

function pref(p: Partial<NotificationPreference>): NotificationPreference {
  return {
    organizationId: null,
    channelId: null,
    notificationsEnabled: true,
    quietHoursStart: null,
    quietHoursEnd: null,
    ...p,
  };
}

describe('inQuietWindow', () => {
  it('handles a normal daytime window', () => {
    expect(inQuietWindow(10, 8, 12)).toBe(true);
    expect(inQuietWindow(12, 8, 12)).toBe(false); // end exclusive
    expect(inQuietWindow(7, 8, 12)).toBe(false);
  });
  it('handles a window that wraps midnight (22 → 7)', () => {
    expect(inQuietWindow(23, 22, 7)).toBe(true);
    expect(inQuietWindow(3, 22, 7)).toBe(true);
    expect(inQuietWindow(7, 22, 7)).toBe(false);
    expect(inQuietWindow(12, 22, 7)).toBe(false);
  });
  it('treats an empty window as no quiet hours', () => {
    expect(inQuietWindow(5, 6, 6)).toBe(false);
  });
});

describe('shouldNotify', () => {
  it('defaults to enabled when there are no preferences', () => {
    expect(shouldNotify([], target)).toBe(true);
  });

  it('master mute disables everything', () => {
    expect(shouldNotify([pref({ notificationsEnabled: false })], target)).toBe(false);
  });

  it('org-level mute overrides the master default', () => {
    expect(
      shouldNotify([pref({ organizationId: org, notificationsEnabled: false })], target),
    ).toBe(false);
  });

  it('channel-level choice wins over org-level', () => {
    const prefs = [
      pref({ organizationId: org, notificationsEnabled: false }), // org muted
      pref({ organizationId: org, channelId: chan, notificationsEnabled: true }), // but this channel on
    ];
    expect(shouldNotify(prefs, target)).toBe(true);
  });

  it('suppresses during quiet hours from the most specific level', () => {
    const prefs = [pref({ organizationId: org, quietHoursStart: 22, quietHoursEnd: 7 })];
    expect(shouldNotify(prefs, { ...target, localHour: 2 })).toBe(false);
    expect(shouldNotify(prefs, { ...target, localHour: 9 })).toBe(true);
  });

  it('a more specific level without quiet hours still inherits a less specific quiet window', () => {
    const prefs = [
      pref({ quietHoursStart: 22, quietHoursEnd: 7 }), // master quiet window
      pref({ organizationId: org, channelId: chan, notificationsEnabled: true }), // channel on, no quiet
    ];
    expect(shouldNotify(prefs, { ...target, localHour: 2 })).toBe(false);
  });
});
