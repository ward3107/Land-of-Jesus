/**
 * Roles & permissions for CommunityDirect.
 *
 * Authorization is enforced in two layers:
 *   1. Database — Supabase Row Level Security (the source of truth, see docs/MULTITENANCY.md).
 *   2. Application — these helpers, for fast UX gating and server-side pre-checks.
 *
 * Never rely on the application layer alone; RLS is authoritative.
 */

export const ROLES = [
  'PLATFORM_SUPER_ADMIN',
  'ORGANIZATION_OWNER',
  'ORGANIZATION_ADMIN',
  'CONTENT_EDITOR',
  'ANALYST',
  'SUBSCRIBER',
] as const;

export type Role = (typeof ROLES)[number];

/**
 * A permission is a `resource:action` capability string. Keeping them as flat
 * strings (rather than nested objects) makes them trivial to serialize into a
 * JWT claim or compare against an RLS policy predicate.
 */
export const PERMISSIONS = [
  'org:manage', // rename, logo, description, category, delete
  'org:members:manage', // invite / remove / re-role admins
  'org:billing:manage', // future billing (architecture only in MVP)
  'org:verify', // grant VERIFIED status — platform only
  'messages:read',
  'messages:create',
  'messages:edit',
  'messages:send',
  'messages:delete',
  'channels:manage',
  'segments:manage',
  'subscribers:read',
  'subscribers:manage',
  'media:manage',
  'analytics:read',
  'audit:read',
  'platform:admin', // cross-tenant platform operations
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ORG_FULL: Permission[] = [
  'org:manage',
  'org:members:manage',
  'org:billing:manage',
  'messages:read',
  'messages:create',
  'messages:edit',
  'messages:send',
  'messages:delete',
  'channels:manage',
  'segments:manage',
  'subscribers:read',
  'subscribers:manage',
  'media:manage',
  'analytics:read',
  'audit:read',
];

const ORG_ADMIN: Permission[] = [
  'messages:read',
  'messages:create',
  'messages:edit',
  'messages:send',
  'messages:delete',
  'channels:manage',
  'segments:manage',
  'subscribers:read',
  'subscribers:manage',
  'media:manage',
  'analytics:read',
];

const CONTENT_EDITOR: Permission[] = [
  'messages:read',
  'messages:create',
  'messages:edit',
  'media:manage',
];

const ANALYST: Permission[] = ['analytics:read', 'messages:read'];

/**
 * The permission matrix. `PLATFORM_SUPER_ADMIN` is intentionally granted every
 * permission plus the cross-tenant `platform:admin` capability.
 */
export const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  PLATFORM_SUPER_ADMIN: new Set<Permission>([...PERMISSIONS]),
  ORGANIZATION_OWNER: new Set<Permission>(ORG_FULL),
  ORGANIZATION_ADMIN: new Set<Permission>(ORG_ADMIN),
  CONTENT_EDITOR: new Set<Permission>(CONTENT_EDITOR),
  ANALYST: new Set<Permission>(ANALYST),
  SUBSCRIBER: new Set<Permission>([]),
};

/** Roles that operate inside the admin dashboard (i.e. belong to an organization). */
export const ADMIN_ROLES: readonly Role[] = [
  'ORGANIZATION_OWNER',
  'ORGANIZATION_ADMIN',
  'CONTENT_EDITOR',
  'ANALYST',
];

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

/** Returns true if `role` holds `permission`. */
export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

/** Returns true if `role` holds every permission in `permissions`. */
export function canAll(role: Role, permissions: readonly Permission[]): boolean {
  return permissions.every((p) => can(role, p));
}

/** Returns true if `role` holds at least one permission in `permissions`. */
export function canAny(role: Role, permissions: readonly Permission[]): boolean {
  return permissions.some((p) => can(role, p));
}

export function isPlatformAdmin(role: Role): boolean {
  return role === 'PLATFORM_SUPER_ADMIN';
}

/** Only members of an organization may access the admin dashboard. */
export function isOrganizationRole(role: Role): boolean {
  return ADMIN_ROLES.includes(role);
}
