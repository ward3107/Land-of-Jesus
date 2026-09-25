import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { locales } from '@/lib/i18n/config';

type Messages = { [key: string]: string | Messages };

const load = (locale: string): Messages =>
  JSON.parse(readFileSync(resolve(process.cwd(), 'messages', `${locale}.json`), 'utf8')) as Messages;

function flatten(obj: Messages, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') out[`${prefix}${key}`] = value;
    else Object.assign(out, flatten(value, `${prefix}${key}.`));
  }
  return out;
}

const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();

const en = flatten(load('en'));
const enKeys = Object.keys(en).sort();

const REQUIRED_KEYS = [
  'Common.backToTop',
  'Common.language',
  'Common.close',
  'Common.skipToContent',
  'Common.searchLanguages',
  'Common.noLanguageMatch',
  'Navigation.primaryNav',
  'Navigation.footerNav',
  'HomePage.swipeHint',
  'Explore.viewMode',
  'Explore.viewChurch',
  'Explore.cityNazareth',
  'Explore.cityBethlehem',
  'Explore.cityJerusalem',
  'Metadata.title',
  'Metadata.description',
  'ProjectProfile.currentConditionBody',
  'ProjectStatus.APPROVED',
  'ProjectStatus.IMPLEMENTATION',
  'UpdateType.milestone',
  'UpdateType.progress',
];

describe('messages/en.json', () => {
  it.each(REQUIRED_KEYS)('defines %s', (key) => {
    expect(en[key]?.trim()).toBeTruthy();
  });
});

describe.each(locales.filter((l) => l !== 'en'))('messages/%s.json', (locale) => {
  const messages = flatten(load(locale));

  it('has exactly the English keys', () => {
    expect(Object.keys(messages).sort()).toEqual(enKeys);
  });

  it('has no empty strings', () => {
    expect(Object.entries(messages).filter(([, v]) => !v.trim()).map(([k]) => k)).toEqual([]);
  });

  it('keeps every ICU placeholder', () => {
    for (const key of enKeys) expect(placeholders(messages[key] ?? ''), key).toEqual(placeholders(en[key]));
  });

  it('is actually translated (at most 15% of strings identical to English)', () => {
    const identical = enKeys.filter((k) => messages[k] === en[k]);
    expect(identical.length / enKeys.length, identical.join(', ')).toBeLessThanOrEqual(0.15);
  });
});
