/**
 * Notification-preference resolution.
 *
 * A subscriber can mute at three granularities (most specific wins):
 *   channel-level → organization-level → master (all notifications).
 * Each level may also define quiet hours. This pure logic decides whether a
 * given message should surface a notification; it is used both by the mobile
 * preferences UI and (server-side) by the delivery worker.
 */

export interface NotificationPreference {
  /** null organizationId + null channelId = the master switch. */
  organizationId: string | null;
  channelId: string | null;
  notificationsEnabled: boolean;
  /** Local-time quiet window [start, end); may wrap midnight. null = unset. */
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
}

export interface NotificationTarget {
  organizationId: string;
  channelId: string | null;
  /** Subscriber's local hour, 0–23. */
  localHour: number;
}

/** True if `hour` falls inside the quiet window [start, end), wrapping midnight. */
export function inQuietWindow(hour: number, start: number, end: number): boolean {
  if (start === end) return false; // empty / disabled window
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end; // wraps past midnight
}

function mostSpecific(
  prefs: readonly NotificationPreference[],
  target: NotificationTarget,
): NotificationPreference[] {
  const channel =
    target.channelId != null
      ? prefs.find(
          (p) => p.organizationId === target.organizationId && p.channelId === target.channelId,
        )
      : undefined;
  const org = prefs.find((p) => p.organizationId === target.organizationId && p.channelId == null);
  const master = prefs.find((p) => p.organizationId == null && p.channelId == null);
  // Ordered most-specific → least-specific, skipping undefined levels.
  return [channel, org, master].filter((p): p is NotificationPreference => p != null);
}

/**
 * Whether a message to `target` should raise a notification given the
 * subscriber's `prefs`. Defaults to enabled when no preference is set.
 */
export function shouldNotify(
  prefs: readonly NotificationPreference[],
  target: NotificationTarget,
): boolean {
  const chain = mostSpecific(prefs, target);

  // Enabled: the most specific level that expresses a choice wins.
  const enabled = chain.length > 0 ? chain[0]!.notificationsEnabled : true;
  if (!enabled) return false;

  // Quiet hours: the most specific level that defines a window applies.
  const withQuiet = chain.find((p) => p.quietHoursStart != null && p.quietHoursEnd != null);
  if (withQuiet && inQuietWindow(target.localHour, withQuiet.quietHoursStart!, withQuiet.quietHoursEnd!)) {
    return false;
  }
  return true;
}
