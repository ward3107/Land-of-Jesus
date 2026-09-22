/**
 * Tenant-isolation helpers.
 *
 * Multi-tenancy is enforced at the database with RLS. These helpers give the
 * application server a fast, well-tested way to fail closed *before* a query is
 * ever issued, and to make tenant scoping explicit and greppable in code.
 */
import { isPlatformAdmin, type Role } from './roles';

export class TenantIsolationError extends Error {
  constructor(message = 'Cross-tenant access denied') {
    super(message);
    this.name = 'TenantIsolationError';
  }
}

export interface TenantContext {
  userId: string;
  /** The organization the current request is scoped to. Null for platform-only sessions. */
  organizationId: string | null;
  role: Role;
}

/**
 * Whether `ctx` may access data belonging to `organizationId`.
 * Platform super admins may access any tenant; everyone else is confined to
 * their own organization.
 */
export function canAccessOrganization(ctx: TenantContext, organizationId: string): boolean {
  if (isPlatformAdmin(ctx.role)) return true;
  return ctx.organizationId !== null && ctx.organizationId === organizationId;
}

/** Throws {@link TenantIsolationError} unless `ctx` may access `organizationId`. */
export function assertCanAccessOrganization(ctx: TenantContext, organizationId: string): void {
  if (!canAccessOrganization(ctx, organizationId)) {
    throw new TenantIsolationError(
      `User ${ctx.userId} (org ${ctx.organizationId ?? 'none'}) may not access org ${organizationId}`,
    );
  }
}

/** Throws unless two records belong to the same tenant. */
export function assertSameTenant(
  a: { organizationId: string },
  b: { organizationId: string },
): void {
  if (a.organizationId !== b.organizationId) {
    throw new TenantIsolationError(
      `Records belong to different tenants: ${a.organizationId} !== ${b.organizationId}`,
    );
  }
}

/**
 * Returns an equality filter that scopes a query to the caller's tenant.
 * For a platform admin an explicit `organizationId` must be provided; otherwise
 * the caller's own organization is used. This centralizes the single most
 * important WHERE clause in the product.
 */
export function organizationScope(
  ctx: TenantContext,
  explicitOrganizationId?: string,
): { organizationId: string } {
  if (isPlatformAdmin(ctx.role)) {
    if (!explicitOrganizationId) {
      throw new TenantIsolationError('Platform admin must specify an organization to scope to');
    }
    return { organizationId: explicitOrganizationId };
  }
  if (!ctx.organizationId) {
    throw new TenantIsolationError('Session is not attached to an organization');
  }
  if (explicitOrganizationId && explicitOrganizationId !== ctx.organizationId) {
    throw new TenantIsolationError('Cannot scope a query outside your organization');
  }
  return { organizationId: ctx.organizationId };
}

/**
 * Filters a list of records to only those visible to `ctx`. Defense in depth —
 * even if a query accidentally over-selects, this strips foreign-tenant rows.
 */
export function filterVisible<T extends { organizationId: string }>(
  ctx: TenantContext,
  records: readonly T[],
): T[] {
  if (isPlatformAdmin(ctx.role)) return [...records];
  return records.filter((r) => canAccessOrganization(ctx, r.organizationId));
}
