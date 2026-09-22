/**
 * Segment resolution.
 *
 * A segment is a saved, composable filter over an organization's subscribers.
 * The same rule model is evaluated in two places:
 *   - In the database, compiled to a SQL predicate for audience resolution at
 *     send time (see docs/DATABASE.md).
 *   - Here, in-memory, for previews ("this reaches ~1,240 people") and tests.
 *
 * Keeping one canonical rule model avoids drift between preview and delivery.
 *
 * Privacy: fields are limited to explicitly-provided, low-sensitivity
 * attributes. No behavioral profiling (see docs/PRIVACY.md).
 */
import { z } from 'zod';

export const SEGMENT_FIELDS = [
  'language',
  'channel',
  'location',
  'tag',
  'signup_source',
] as const;
export type SegmentField = (typeof SEGMENT_FIELDS)[number];

export const SEGMENT_OPERATORS = ['eq', 'in', 'contains', 'exists'] as const;
export type SegmentOperator = (typeof SEGMENT_OPERATORS)[number];

export const segmentRuleSchema = z.object({
  field: z.enum(SEGMENT_FIELDS),
  operator: z.enum(SEGMENT_OPERATORS),
  /** Comparison values. `exists` ignores values; `eq`/`contains` use the first. */
  values: z.array(z.string().min(1)).default([]),
});
export type SegmentRule = z.infer<typeof segmentRuleSchema>;

export const segmentDefinitionSchema = z.object({
  /** `all` = AND across rules, `any` = OR across rules. */
  match: z.enum(['all', 'any']).default('all'),
  rules: z.array(segmentRuleSchema).max(50),
});
export type SegmentDefinition = z.infer<typeof segmentDefinitionSchema>;

/**
 * The projection of a subscriber used for segment evaluation. Deliberately
 * minimal — only what an organization needs to route a message.
 */
export interface SubscriberProjection {
  id: string;
  organizationId: string;
  language: string | null;
  channelIds: string[];
  location: string | null;
  tags: string[];
  signupSource: string | null;
  /** Following must be explicit; unsubscribed subscribers are never in an audience. */
  active: boolean;
}

function subscriberValues(rule: SegmentRule, s: SubscriberProjection): string[] {
  switch (rule.field) {
    case 'language':
      return s.language ? [s.language] : [];
    case 'channel':
      return s.channelIds;
    case 'location':
      return s.location ? [s.location] : [];
    case 'tag':
      return s.tags;
    case 'signup_source':
      return s.signupSource ? [s.signupSource] : [];
  }
}

/** Evaluate a single rule against a subscriber. */
export function matchesRule(rule: SegmentRule, s: SubscriberProjection): boolean {
  const actual = subscriberValues(rule, s);
  switch (rule.operator) {
    case 'exists':
      return actual.length > 0;
    case 'eq':
      return rule.values.length > 0 && actual.length > 0 && actual[0] === rule.values[0];
    case 'in':
      return actual.some((v) => rule.values.includes(v));
    case 'contains':
      return rule.values.length > 0 && actual.includes(rule.values[0]!);
  }
}

/** Evaluate a full segment definition against a subscriber. */
export function matchesSegment(def: SegmentDefinition, s: SubscriberProjection): boolean {
  if (!s.active) return false;
  if (def.rules.length === 0) return true; // empty segment = "all active subscribers"
  return def.match === 'all'
    ? def.rules.every((r) => matchesRule(r, s))
    : def.rules.some((r) => matchesRule(r, s));
}

/**
 * Resolve a segment to the subset of subscribers it targets. Subscribers are
 * assumed to already be scoped to a single organization by the caller; as a
 * safety net we also drop any whose `organizationId` differs from the majority
 * is *not* done here — callers must pass a pre-scoped list (RLS guarantees it).
 */
export function resolveSegment(
  def: SegmentDefinition,
  subscribers: readonly SubscriberProjection[],
): SubscriberProjection[] {
  return subscribers.filter((s) => matchesSegment(def, s));
}

/** Estimated reach without materializing the full list. */
export function estimateReach(
  def: SegmentDefinition,
  subscribers: readonly SubscriberProjection[],
): number {
  let count = 0;
  for (const s of subscribers) if (matchesSegment(def, s)) count++;
  return count;
}
