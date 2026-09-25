import { describe, expect, it, vi } from 'vitest';
import {
  entityId,
  fetchTranslations,
  legacyLocalized,
  tr,
  translationKey,
} from '@/lib/data/translate';

vi.mock('@/lib/supabase/server', () => ({ createSupabaseServerClient: vi.fn() }));

type Client = Parameters<typeof fetchTranslations>[0];

function fakeClient(result: { data: unknown; error: unknown } | Error) {
  const calls: unknown[][] = [];
  const builder = {
    select: (...args: unknown[]) => (calls.push(['select', ...args]), builder),
    eq: (...args: unknown[]) => (calls.push(['eq', ...args]), builder),
    in: (...args: unknown[]) => {
      calls.push(['in', ...args]);
      return result instanceof Error ? Promise.reject(result) : Promise.resolve(result);
    },
  };
  const from = vi.fn((table: string) => (calls.push(['from', table]), builder));
  return { client: { from } as unknown as Client, from, calls };
}

describe('tr', () => {
  const map = new Map([
    [translationKey('church', 'c1', 'name'), 'Храм'],
    [translationKey('church', 'c1', 'blank'), '   '],
  ]);

  it('returns the translation when present', () => {
    expect(tr(map, 'church', 'c1', 'name', 'Church')).toBe('Храм');
  });

  it('falls back when missing, blank, or the entity has no id', () => {
    expect(tr(map, 'church', 'c2', 'name', 'Church')).toBe('Church');
    expect(tr(map, 'church', 'c1', 'blank', 'Church')).toBe('Church');
    expect(tr(map, 'church', undefined, 'name', 'Church')).toBe('Church');
  });
});

describe('legacyLocalized', () => {
  it('uses the Arabic/Hebrew legacy columns only for ar/he and only when non-empty', () => {
    expect(legacyLocalized('ar', 'Church', 'كنيسة', 'כנסייה')).toBe('كنيسة');
    expect(legacyLocalized('he', 'Church', 'كنيسة', 'כנסייה')).toBe('כנסייה');
    expect(legacyLocalized('he', 'Church', 'كنيسة', '')).toBe('Church');
    expect(legacyLocalized('ru', 'Church', 'كنيسة', 'כנסייה')).toBe('Church');
    expect(legacyLocalized('en', null)).toBe('');
  });
});

describe('entityId', () => {
  it('reads the id of a row', () => {
    expect(entityId({ id: 'x1' })).toBe('x1');
    expect(entityId({})).toBeUndefined();
    expect(entityId(undefined)).toBeUndefined();
  });
});

describe('fetchTranslations', () => {
  it('does not query for English or when there are no ids', async () => {
    const { client, from } = fakeClient({ data: [], error: null });
    expect((await fetchTranslations(client, 'en', ['c1'])).size).toBe(0);
    expect((await fetchTranslations(client, 'ru', [])).size).toBe(0);
    expect(from).not.toHaveBeenCalled();
  });

  it('queries published rows for the locale and de-duplicated ids, keyed by translationKey', async () => {
    const { client, calls } = fakeClient({
      data: [{ entity_type: 'church', entity_id: 'c1', field: 'name', content: 'Храм' }],
      error: null,
    });
    const map = await fetchTranslations(client, 'ru', ['c1', 'c1', 'l1']);
    expect(map.get(translationKey('church', 'c1', 'name'))).toBe('Храм');
    expect(calls).toEqual([
      ['from', 'translations'],
      ['select', 'entity_type,entity_id,field,content'],
      ['eq', 'locale', 'ru'],
      ['eq', 'status', 'PUBLISHED'],
      ['in', 'entity_id', ['c1', 'l1']],
    ]);
  });

  it('returns an empty map on an error result or a thrown error', async () => {
    expect((await fetchTranslations(fakeClient({ data: null, error: { message: 'x' } }).client, 'ru', ['c1'])).size).toBe(0);
    expect((await fetchTranslations(fakeClient(new Error('network')).client, 'ru', ['c1'])).size).toBe(0);
  });
});
