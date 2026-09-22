/**
 * Slug generation for organization handles and channel names.
 *
 * Rules mirror the DB CHECK constraints:
 *   organizations.slug ~ '^[a-z0-9][a-z0-9-]{1,60}$'
 *   channels.slug      ~ '^[a-z0-9][a-z0-9-]{0,60}$'
 *
 * Non-Latin input (Arabic/Hebrew names are common) can slugify to empty; callers
 * must handle the empty result (e.g. prompt for a manual handle).
 */

export function slugify(input: string, maxLength = 60): string {
  const base = input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip combining marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumerics → hyphen
    .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
    .replace(/-{2,}/g, '-'); // collapse repeats
  return base.slice(0, maxLength).replace(/-+$/g, '');
}

export function isValidOrganizationSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,60}$/.test(slug);
}

export function isValidChannelSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,60}$/.test(slug);
}

/**
 * Produce a slug that is unique among `taken` by appending -2, -3, … as needed.
 */
export function uniqueSlug(input: string, taken: Iterable<string>, maxLength = 60): string {
  const takenSet = new Set(taken);
  const base = slugify(input, maxLength) || 'org';
  if (!takenSet.has(base)) return base;
  for (let i = 2; i < 1000; i++) {
    const suffix = `-${i}`;
    const candidate = `${base.slice(0, maxLength - suffix.length)}${suffix}`;
    if (!takenSet.has(candidate)) return candidate;
  }
  return `${base.slice(0, maxLength - 7)}-${Date.now().toString(36).slice(-5)}`;
}

/** A random, URL-safe join code (matches join_links.code CHECK: [A-Za-z0-9_-]{4,40}). */
export function generateJoinCode(length = 10): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
