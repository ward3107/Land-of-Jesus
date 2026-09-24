import { describe, it, expect } from 'vitest';
import en from '../../../messages/en.json';
import ar from '../../../messages/ar.json';
import he from '../../../messages/he.json';

function keys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj)
    .flatMap(([k, v]) =>
      v && typeof v === 'object' ? keys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`],
    )
    .sort();
}

function get(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((o, part) => (o as Record<string, unknown> | undefined)?.[part], obj);
}

const NEW_KEYS = [
  'Common.backToTop',
  'Common.language',
  'Common.close',
  'Common.skipToContent',
  'Navigation.primaryNav',
  'Navigation.footerNav',
  'HomePage.swipeHint',
  'Explore.viewMode',
];

describe('messages', () => {
  it('ar and he have exactly the same keys as en', () => {
    expect(keys(ar)).toEqual(keys(en));
    expect(keys(he)).toEqual(keys(en));
  });

  it.each(NEW_KEYS)('%s is a non-empty string in every locale', (key) => {
    for (const messages of [en, ar, he]) {
      const value = get(messages, key);
      expect(typeof value).toBe('string');
      expect((value as string).length).toBeGreaterThan(0);
    }
  });
});
