import { describe, expect, it } from 'vitest';
import {
  isValidJoinCode,
  joinLandingPath,
  joinLandingUrl,
  signupSourceFromJoin,
} from './join';

describe('isValidJoinCode', () => {
  it('accepts DB-valid codes', () => {
    expect(isValidJoinCode('aB3xYz')).toBe(true);
    expect(isValidJoinCode('whatsapp_migration-1')).toBe(true);
  });
  it('rejects too-short or illegal codes', () => {
    expect(isValidJoinCode('ab')).toBe(false);
    expect(isValidJoinCode('has space')).toBe(false);
    expect(isValidJoinCode('emoji😀code')).toBe(false);
  });
});

describe('signupSourceFromJoin', () => {
  it('prefers the campaign label', () => {
    expect(signupSourceFromJoin('aB3xYz', 'whatsapp-migration')).toBe('qr:whatsapp-migration');
  });
  it('falls back to the code when no campaign', () => {
    expect(signupSourceFromJoin('aB3xYz')).toBe('join:aB3xYz');
    expect(signupSourceFromJoin('aB3xYz', '   ')).toBe('join:aB3xYz');
  });
});

describe('join landing URLs', () => {
  it('builds a path and an absolute URL', () => {
    expect(joinLandingPath('aB3xYz')).toBe('/join/aB3xYz');
    expect(joinLandingUrl('https://admin.example.com/', 'aB3xYz')).toBe(
      'https://admin.example.com/join/aB3xYz',
    );
  });
});
