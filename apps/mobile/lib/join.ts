/**
 * Join-link handling for deep links (`communitydirect://join/<code>`) and the
 * web landing page. Resolves the link, records funnel events for attribution,
 * and follows the organization with an explicit signup source — all opt-in.
 * See docs/PUSH-NOTIFICATIONS.md §Join & deep links and docs/PRIVACY.md.
 */
import { isValidJoinCode, signupSourceFromJoin, type JoinEventType } from '@communitydirect/core';
import { supabase } from './supabase';
import { ensureSession } from './session';

export interface ResolvedJoinLink {
  id: string;
  organizationId: string;
  channelId: string | null;
  campaign: string | null;
}

export interface JoinResult {
  ok: boolean;
  organizationId?: string;
  error?: string;
}

export async function resolveJoinLink(code: string): Promise<ResolvedJoinLink | null> {
  if (!isValidJoinCode(code)) return null;
  const { data } = await supabase
    .from('join_links')
    .select('id, organization_id, channel_id, campaign, is_active')
    .eq('code', code)
    .maybeSingle();
  if (!data || !data.is_active) return null;
  return {
    id: data.id,
    organizationId: data.organization_id,
    channelId: data.channel_id,
    campaign: data.campaign,
  };
}

async function recordJoinEvent(
  link: ResolvedJoinLink,
  eventType: JoinEventType,
  profileId: string | null,
): Promise<void> {
  await supabase.from('join_events').insert({
    join_link_id: link.id,
    organization_id: link.organizationId,
    event_type: eventType,
    profile_id: profileId,
  });
}

/**
 * Follow an organization through a join link: record the open, follow with a
 * signup-source attribution tag, opt into the link's channel (if any), and
 * record the follow. Idempotent — re-running reactivates a single follow row.
 */
export async function followViaJoin(code: string): Promise<JoinResult> {
  const link = await resolveJoinLink(code);
  if (!link) return { ok: false, error: 'This invitation link is invalid or expired.' };

  const profileId = await ensureSession();
  await recordJoinEvent(link, 'open', profileId);

  const source = signupSourceFromJoin(code, link.campaign);
  const { error } = await supabase.rpc('follow_organization', {
    p_organization_id: link.organizationId,
    p_language: null,
    p_signup_source: source,
  });
  if (error) return { ok: false, error: error.message, organizationId: link.organizationId };

  if (link.channelId && profileId) {
    await supabase.from('channel_subscriptions').upsert(
      {
        organization_id: link.organizationId,
        channel_id: link.channelId,
        profile_id: profileId,
        active: true,
      },
      { onConflict: 'channel_id,profile_id' },
    );
  }

  await recordJoinEvent(link, 'follow', profileId);
  return { ok: true, organizationId: link.organizationId };
}
