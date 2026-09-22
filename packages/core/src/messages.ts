/**
 * Message model, lifecycle state machine, validation, and translation routing.
 */
import { z } from 'zod';
import { SUPPORTED_LOCALES, type Locale } from './locales';

/** Message lifecycle states. See docs/ARCHITECTURE.md §Message lifecycle. */
export const MESSAGE_STATES = [
  'DRAFT',
  'SCHEDULED',
  'QUEUED',
  'PROCESSING',
  'SENT',
  'PARTIALLY_FAILED',
  'FAILED',
  'CANCELLED',
] as const;

export type MessageState = (typeof MESSAGE_STATES)[number];

/**
 * Allowed transitions. Once a message leaves DRAFT/SCHEDULED it is being
 * delivered and its content is frozen (only cancellation / terminal outcomes
 * remain reachable).
 */
const TRANSITIONS: Record<MessageState, readonly MessageState[]> = {
  DRAFT: ['SCHEDULED', 'QUEUED', 'CANCELLED'],
  SCHEDULED: ['QUEUED', 'DRAFT', 'CANCELLED'],
  QUEUED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SENT', 'PARTIALLY_FAILED', 'FAILED'],
  SENT: [],
  PARTIALLY_FAILED: [],
  FAILED: [],
  CANCELLED: [],
};

export const TERMINAL_STATES: readonly MessageState[] = [
  'SENT',
  'PARTIALLY_FAILED',
  'FAILED',
  'CANCELLED',
];

export function canTransition(from: MessageState, to: MessageState): boolean {
  return TRANSITIONS[from].includes(to);
}

export class InvalidTransitionError extends Error {
  constructor(from: MessageState, to: MessageState) {
    super(`Invalid message transition: ${from} -> ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

export function assertTransition(from: MessageState, to: MessageState): void {
  if (!canTransition(from, to)) throw new InvalidTransitionError(from, to);
}

/** Content may only be edited while the message has not begun sending. */
export function isEditable(state: MessageState): boolean {
  return state === 'DRAFT' || state === 'SCHEDULED';
}

export function isTerminal(state: MessageState): boolean {
  return TERMINAL_STATES.includes(state);
}

// ---------------------------------------------------------------------------
// Validation (composer input)
// ---------------------------------------------------------------------------

const urlSchema = z.string().url().max(2048);

/** A single-language variant of a message body. */
export const messageTranslationSchema = z.object({
  locale: z.enum(SUPPORTED_LOCALES),
  title: z.string().trim().min(1, 'Title is required').max(120),
  body: z.string().trim().min(1, 'Body is required').max(4000),
});
export type MessageTranslation = z.infer<typeof messageTranslationSchema>;

export const messageComposerSchema = z
  .object({
    /** Default locale used when a subscriber has no matching translation. */
    defaultLocale: z.enum(SUPPORTED_LOCALES),
    translations: z
      .array(messageTranslationSchema)
      .min(1, 'At least one language variant is required')
      .max(SUPPORTED_LOCALES.length),
    imageUrl: urlSchema.optional(),
    audioUrl: urlSchema.optional(),
    videoUrl: urlSchema.optional(),
    linkUrl: urlSchema.optional(),
    cta: z
      .object({ label: z.string().trim().min(1).max(40), url: urlSchema })
      .optional(),
    channelIds: z.array(z.string().uuid()).min(1, 'Select at least one channel'),
    segmentId: z.string().uuid().nullable().default(null),
    /** ISO-8601 UTC instant, or null for "send now". */
    scheduledAt: z.string().datetime({ offset: true }).nullable().default(null),
    expiresAt: z.string().datetime({ offset: true }).nullable().default(null),
  })
  .superRefine((val, ctx) => {
    // Default locale must have a translation.
    if (!val.translations.some((t) => t.locale === val.defaultLocale)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['defaultLocale'],
        message: 'The default language must have a translation',
      });
    }
    // No duplicate locales.
    const seen = new Set<string>();
    val.translations.forEach((t, i) => {
      if (seen.has(t.locale)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['translations', i, 'locale'],
          message: `Duplicate translation for locale ${t.locale}`,
        });
      }
      seen.add(t.locale);
    });
    // Expiration must be after schedule.
    if (val.scheduledAt && val.expiresAt && val.expiresAt <= val.scheduledAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expiresAt'],
        message: 'Expiration must be after the scheduled time',
      });
    }
  });

export type MessageComposerInput = z.infer<typeof messageComposerSchema>;

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: { path: string; message: string }[];
}

export function validateMessage(input: unknown): ValidationResult<MessageComposerInput> {
  const parsed = messageComposerSchema.safeParse(input);
  if (parsed.success) return { success: true, data: parsed.data };
  return {
    success: false,
    errors: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
  };
}

// ---------------------------------------------------------------------------
// Translation routing (audience → correct language variant)
// ---------------------------------------------------------------------------

/**
 * Select the best translation for a subscriber's preferred locale, falling back
 * to the message's default locale, then to the first available translation.
 * Machine translation is never synthesized here (see docs/I18N.md).
 */
export function selectTranslation(
  message: { defaultLocale: Locale; translations: readonly MessageTranslation[] },
  subscriberLocale: string | null,
): MessageTranslation | undefined {
  if (message.translations.length === 0) return undefined;
  if (subscriberLocale) {
    const exact = message.translations.find((t) => t.locale === subscriberLocale);
    if (exact) return exact;
  }
  const fallback = message.translations.find((t) => t.locale === message.defaultLocale);
  return fallback ?? message.translations[0];
}

/** Short notification preview text (title + truncated body). */
export function notificationPreview(translation: MessageTranslation, maxBody = 120): string {
  const body =
    translation.body.length > maxBody
      ? `${translation.body.slice(0, maxBody - 1).trimEnd()}…`
      : translation.body;
  return body;
}
