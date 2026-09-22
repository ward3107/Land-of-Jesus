import { describe, expect, it } from 'vitest';
import {
  generateJoinCode,
  isValidChannelSlug,
  isValidOrganizationSlug,
  slugify,
  uniqueSlug,
} from './slug';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Father George Parish')).toBe('father-george-parish');
    expect(slugify('  Nazareth   Youth!! ')).toBe('nazareth-youth');
  });

  it('collapses and trims hyphens', () => {
    expect(slugify('a---b__c')).toBe('a-b-c');
    expect(slugify('--edge--')).toBe('edge');
  });

  it('returns empty for non-Latin-only input (caller must handle)', () => {
    expect(slugify('كنيسة')).toBe('');
    expect(slugify('בית כנסת')).toBe('');
  });

  it('respects maxLength without trailing hyphen', () => {
    expect(slugify('a'.repeat(80)).length).toBe(60);
    expect(slugify('ab cd ef', 5).endsWith('-')).toBe(false);
  });
});

describe('slug validation', () => {
  it('matches the DB constraints', () => {
    expect(isValidOrganizationSlug('org-a')).toBe(true);
    expect(isValidOrganizationSlug('a')).toBe(false); // needs 2+ chars
    expect(isValidOrganizationSlug('-bad')).toBe(false);
    expect(isValidChannelSlug('x')).toBe(true); // channel allows single char
    expect(isValidChannelSlug('Bad Slug')).toBe(false);
  });
});

describe('uniqueSlug', () => {
  it('returns the base when free', () => {
    expect(uniqueSlug('Daily Message', [])).toBe('daily-message');
  });
  it('appends a numeric suffix on collision', () => {
    expect(uniqueSlug('Daily', ['daily'])).toBe('daily-2');
    expect(uniqueSlug('Daily', ['daily', 'daily-2'])).toBe('daily-3');
  });
  it('falls back to a safe base for empty slugs', () => {
    expect(uniqueSlug('كنيسة', [])).toBe('org');
    expect(uniqueSlug('كنيسة', ['org'])).toBe('org-2');
  });
});

describe('generateJoinCode', () => {
  it('produces a code matching the DB constraint', () => {
    for (let i = 0; i < 20; i++) {
      const code = generateJoinCode();
      expect(code).toMatch(/^[A-Za-z0-9_-]{4,40}$/);
      expect(code).toHaveLength(10);
    }
  });
});
