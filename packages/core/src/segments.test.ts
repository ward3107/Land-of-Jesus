import { describe, expect, it } from 'vitest';
import {
  estimateReach,
  matchesSegment,
  resolveSegment,
  segmentDefinitionSchema,
  type SegmentDefinition,
  type SubscriberProjection,
} from './segments';

const org = 'org-1';

function sub(overrides: Partial<SubscriberProjection>): SubscriberProjection {
  return {
    id: Math.random().toString(36).slice(2),
    organizationId: org,
    language: 'en',
    channelIds: [],
    location: null,
    tags: [],
    signupSource: null,
    active: true,
    ...overrides,
  };
}

const people: SubscriberProjection[] = [
  sub({ id: 'ar-youth', language: 'ar', channelIds: ['c-youth'], tags: ['youth'] }),
  sub({ id: 'ar-naz', language: 'ar', location: 'Nazareth', channelIds: ['c-daily'] }),
  sub({ id: 'he-daily', language: 'he', channelIds: ['c-daily'], signupSource: 'qr-A' }),
  sub({ id: 'en-none', language: 'en', channelIds: [] }),
  sub({ id: 'ar-inactive', language: 'ar', channelIds: ['c-daily'], active: false }),
];

describe('segment resolution', () => {
  it('empty segment targets all active subscribers', () => {
    const def: SegmentDefinition = { match: 'all', rules: [] };
    const reached = resolveSegment(def, people).map((s) => s.id);
    expect(reached).not.toContain('ar-inactive');
    expect(reached).toHaveLength(4);
  });

  it('filters Arabic speakers', () => {
    const def: SegmentDefinition = {
      match: 'all',
      rules: [{ field: 'language', operator: 'eq', values: ['ar'] }],
    };
    expect(resolveSegment(def, people).map((s) => s.id).sort()).toEqual(['ar-naz', 'ar-youth']);
  });

  it('AND combines rules (Arabic AND youth channel)', () => {
    const def: SegmentDefinition = {
      match: 'all',
      rules: [
        { field: 'language', operator: 'eq', values: ['ar'] },
        { field: 'channel', operator: 'in', values: ['c-youth'] },
      ],
    };
    expect(resolveSegment(def, people).map((s) => s.id)).toEqual(['ar-youth']);
  });

  it('OR combines rules (Nazareth OR joined via QR campaign A)', () => {
    const def: SegmentDefinition = {
      match: 'any',
      rules: [
        { field: 'location', operator: 'eq', values: ['Nazareth'] },
        { field: 'signup_source', operator: 'eq', values: ['qr-A'] },
      ],
    };
    expect(resolveSegment(def, people).map((s) => s.id).sort()).toEqual(['ar-naz', 'he-daily']);
  });

  it('exists operator matches presence of any value', () => {
    const def: SegmentDefinition = {
      match: 'all',
      rules: [{ field: 'location', operator: 'exists', values: [] }],
    };
    expect(resolveSegment(def, people).map((s) => s.id)).toEqual(['ar-naz']);
  });

  it('never includes unsubscribed (inactive) subscribers', () => {
    const def: SegmentDefinition = {
      match: 'all',
      rules: [{ field: 'channel', operator: 'in', values: ['c-daily'] }],
    };
    const reached = resolveSegment(def, people).map((s) => s.id);
    expect(reached).toContain('ar-naz');
    expect(reached).toContain('he-daily');
    expect(reached).not.toContain('ar-inactive');
  });

  it('estimateReach matches resolveSegment length', () => {
    const def: SegmentDefinition = {
      match: 'all',
      rules: [{ field: 'language', operator: 'eq', values: ['ar'] }],
    };
    expect(estimateReach(def, people)).toBe(resolveSegment(def, people).length);
  });

  it('validates segment definitions with zod', () => {
    const parsed = segmentDefinitionSchema.safeParse({
      match: 'all',
      rules: [{ field: 'language', operator: 'eq', values: ['ar'] }],
    });
    expect(parsed.success).toBe(true);
    const bad = segmentDefinitionSchema.safeParse({
      match: 'all',
      rules: [{ field: 'not-a-field', operator: 'eq', values: ['x'] }],
    });
    expect(bad.success).toBe(false);
  });

  it('matchesSegment is a pure boolean over a single subscriber', () => {
    const def: SegmentDefinition = {
      match: 'all',
      rules: [{ field: 'tag', operator: 'contains', values: ['youth'] }],
    };
    expect(matchesSegment(def, people[0]!)).toBe(true);
    expect(matchesSegment(def, people[3]!)).toBe(false);
  });
});
