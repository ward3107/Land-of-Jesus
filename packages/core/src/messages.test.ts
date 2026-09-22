import { describe, expect, it } from 'vitest';
import {
  assertTransition,
  canTransition,
  InvalidTransitionError,
  isEditable,
  isTerminal,
  notificationPreview,
  selectTranslation,
  validateMessage,
  type MessageComposerInput,
} from './messages';

const validInput: MessageComposerInput = {
  defaultLocale: 'en',
  translations: [
    { locale: 'en', title: 'Good morning', body: 'Have a blessed day.' },
    { locale: 'ar', title: 'صباح الخير', body: 'نهارك سعيد.' },
  ],
  channelIds: ['11111111-1111-1111-1111-111111111111'],
  segmentId: null,
  scheduledAt: null,
  expiresAt: null,
};

describe('message lifecycle', () => {
  it('permits only valid transitions', () => {
    expect(canTransition('DRAFT', 'SCHEDULED')).toBe(true);
    expect(canTransition('DRAFT', 'QUEUED')).toBe(true);
    expect(canTransition('QUEUED', 'PROCESSING')).toBe(true);
    expect(canTransition('PROCESSING', 'SENT')).toBe(true);
    expect(canTransition('PROCESSING', 'PARTIALLY_FAILED')).toBe(true);
    // Illegal jumps
    expect(canTransition('DRAFT', 'SENT')).toBe(false);
    expect(canTransition('SENT', 'DRAFT')).toBe(false);
    expect(canTransition('QUEUED', 'DRAFT')).toBe(false);
  });

  it('assertTransition throws on illegal transitions', () => {
    expect(() => assertTransition('SENT', 'PROCESSING')).toThrow(InvalidTransitionError);
    expect(() => assertTransition('DRAFT', 'QUEUED')).not.toThrow();
  });

  it('content is frozen once sending begins', () => {
    expect(isEditable('DRAFT')).toBe(true);
    expect(isEditable('SCHEDULED')).toBe(true);
    expect(isEditable('QUEUED')).toBe(false);
    expect(isEditable('PROCESSING')).toBe(false);
    expect(isEditable('SENT')).toBe(false);
  });

  it('identifies terminal states', () => {
    expect(isTerminal('SENT')).toBe(true);
    expect(isTerminal('CANCELLED')).toBe(true);
    expect(isTerminal('DRAFT')).toBe(false);
  });
});

describe('message validation', () => {
  it('accepts a well-formed message', () => {
    const res = validateMessage(validInput);
    expect(res.success).toBe(true);
  });

  it('requires the default locale to have a translation', () => {
    const res = validateMessage({ ...validInput, defaultLocale: 'he' });
    expect(res.success).toBe(false);
    expect(res.errors?.some((e) => e.path === 'defaultLocale')).toBe(true);
  });

  it('rejects duplicate locales', () => {
    const res = validateMessage({
      ...validInput,
      translations: [
        { locale: 'en', title: 'A', body: 'a' },
        { locale: 'en', title: 'B', body: 'b' },
      ],
    });
    expect(res.success).toBe(false);
  });

  it('rejects empty title/body', () => {
    const res = validateMessage({
      ...validInput,
      translations: [{ locale: 'en', title: '', body: '' }],
    });
    expect(res.success).toBe(false);
  });

  it('requires at least one channel', () => {
    const res = validateMessage({ ...validInput, channelIds: [] });
    expect(res.success).toBe(false);
  });

  it('rejects expiration before schedule', () => {
    const res = validateMessage({
      ...validInput,
      scheduledAt: '2026-01-01T10:00:00Z',
      expiresAt: '2026-01-01T09:00:00Z',
    });
    expect(res.success).toBe(false);
    expect(res.errors?.some((e) => e.path === 'expiresAt')).toBe(true);
  });

  it('rejects invalid media URLs', () => {
    const res = validateMessage({ ...validInput, imageUrl: 'not-a-url' });
    expect(res.success).toBe(false);
  });
});

describe('translation routing', () => {
  const message = {
    defaultLocale: 'en' as const,
    translations: validInput.translations,
  };

  it('picks the exact locale when available', () => {
    expect(selectTranslation(message, 'ar')?.locale).toBe('ar');
  });

  it('falls back to the default locale', () => {
    expect(selectTranslation(message, 'he')?.locale).toBe('en');
  });

  it('falls back to first translation if default is missing', () => {
    const arOnly = { defaultLocale: 'he' as const, translations: [validInput.translations[1]!] };
    expect(selectTranslation(arOnly, 'en')?.locale).toBe('ar');
  });

  it('builds a truncated notification preview', () => {
    const preview = notificationPreview(
      { locale: 'en', title: 'T', body: 'x'.repeat(200) },
      50,
    );
    expect(preview.length).toBeLessThanOrEqual(50);
    expect(preview.endsWith('…')).toBe(true);
  });
});
