import { describe, expect, it } from 'vitest';
import { buildContentSql, parseKey, sqlString } from '../../../scripts/build-content-sql.mjs';

describe('sqlString', () => {
  it('quotes and escapes single quotes', () => {
    expect(sqlString("Saint Peter's")).toBe("'Saint Peter''s'");
  });
});

describe('parseKey', () => {
  it('splits entity type, id and a dotted field', () => {
    expect(parseKey('project_budget:c0cc6e00-2657-4be2-8f20-29faf38a448d:item.2')).toEqual({
      entityType: 'project_budget',
      entityId: 'c0cc6e00-2657-4be2-8f20-29faf38a448d',
      field: 'item.2',
    });
  });

  it('rejects malformed keys', () => {
    expect(() => parseKey('church:only-two')).toThrow(/Bad content key/);
  });
});

describe('buildContentSql', () => {
  const files = {
    en: {
      fields: { 'church:c1:name': 'Basilica' },
      descriptions: { c1: { overview: 'EN o', story: 'EN s', community: 'EN c' } },
    },
    ru: {
      fields: { 'church:c1:name': "Храм Петра'" },
      descriptions: { c1: { overview: 'RU o', story: 'RU s', community: 'RU c' } },
    },
  };
  const sql = buildContentSql(files);

  it('wraps everything in one transaction', () => {
    expect(sql.startsWith('-- 006')).toBe(true);
    expect(sql).toContain('BEGIN;');
    expect(sql.trimEnd().endsWith('COMMIT;')).toBe(true);
  });

  it('upserts published translations for non-English locales only', () => {
    expect(sql).toContain(
      "INSERT INTO public.translations (entity_type, entity_id, field, locale, content, status, source_locale) VALUES ('church', 'c1', 'name', 'ru', 'Храм Петра''', 'PUBLISHED', 'en') ON CONFLICT (entity_type, entity_id, field, locale) DO UPDATE SET content = EXCLUDED.content, status = 'PUBLISHED', updated_at = NOW();",
    );
    expect(sql).not.toContain("'name', 'en'");
  });

  it('upserts descriptions for every locale, English included', () => {
    expect(sql).toContain(
      "INSERT INTO public.church_descriptions (church_id, locale, overview, story, community) VALUES ('c1', 'en', 'EN o', 'EN s', 'EN c') ON CONFLICT (church_id, locale) DO UPDATE SET overview = EXCLUDED.overview, story = EXCLUDED.story, community = EXCLUDED.community;",
    );
    expect(sql).toContain("VALUES ('c1', 'ru', 'RU o', 'RU s', 'RU c')");
  });

  it('is deterministic (English first, then locales alphabetically)', () => {
    expect(buildContentSql({ ru: files.ru, en: files.en })).toBe(sql);
    expect(sql.indexOf('-- en')).toBeLessThan(sql.indexOf('-- ru'));
  });
});
