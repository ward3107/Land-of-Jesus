import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { locales } from '@/lib/i18n/config';
import { OUTPUT_FILE, buildContentSql, readContentFiles } from '../../../scripts/build-content-sql.mjs';

type ContentFile = {
  fields: Record<string, string>;
  descriptions: Record<string, { overview: string; story: string; community: string }>;
};

const files = readContentFiles() as Record<string, ContentFile>;
const en = files.en;
const CHURCH_IDS = [
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003',
];

describe('supabase/content-i18n', () => {
  it('has a file for every site locale and nothing else', () => {
    expect(Object.keys(files).sort()).toEqual([...locales].sort());
  });

  it('describes every church in English with overview, story and community', () => {
    const ids = Object.keys(en.descriptions);
    // The original seed churches must always be present...
    for (const id of CHURCH_IDS) expect(ids).toContain(id);
    // ...and every described church (seed + added) has the three fields filled.
    for (const [id, d] of Object.entries(en.descriptions)) {
      expect(d.overview?.trim(), `${id}.overview`).toBeTruthy();
      expect(d.story?.trim(), `${id}.story`).toBeTruthy();
      expect(d.community?.trim(), `${id}.community`).toBeTruthy();
    }
  });

  it('keeps the committed SQL in sync with the content files', () => {
    const committed = readFileSync(resolve(process.cwd(), OUTPUT_FILE), 'utf8').replace(/\r\n/g, '\n');
    expect(committed).toBe(buildContentSql(files));
  });
});

describe.each(locales.filter((l) => l !== 'en'))('supabase/content-i18n/%s.json', (locale) => {
  const file = files[locale];

  it('has exactly the English field keys and churches', () => {
    expect(Object.keys(file.fields).sort()).toEqual(Object.keys(en.fields).sort());
    expect(Object.keys(file.descriptions).sort()).toEqual(Object.keys(en.descriptions).sort());
  });

  it('has no empty text', () => {
    const empty = Object.entries(file.fields).filter(([, v]) => !v.trim()).map(([k]) => k);
    for (const [id, d] of Object.entries(file.descriptions)) {
      for (const [k, v] of Object.entries(d)) if (!v.trim()) empty.push(`${id}.${k}`);
    }
    expect(empty).toEqual([]);
  });

  it('is actually translated (at most 30% of fields identical to English)', () => {
    const keys = Object.keys(en.fields);
    const identical = keys.filter((k) => file.fields[k] === en.fields[k]);
    expect(identical.length / keys.length, identical.join(', ')).toBeLessThanOrEqual(0.3);
  });
});
