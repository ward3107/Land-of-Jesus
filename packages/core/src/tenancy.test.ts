import { describe, expect, it } from 'vitest';
import {
  assertCanAccessOrganization,
  assertSameTenant,
  canAccessOrganization,
  filterVisible,
  organizationScope,
  TenantContext,
  TenantIsolationError,
} from './tenancy';

const orgA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const orgB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

const memberOfA: TenantContext = { userId: 'u1', organizationId: orgA, role: 'ORGANIZATION_ADMIN' };
const platform: TenantContext = { userId: 'p1', organizationId: null, role: 'PLATFORM_SUPER_ADMIN' };

describe('tenant isolation', () => {
  it('a member can access their own org and no other', () => {
    expect(canAccessOrganization(memberOfA, orgA)).toBe(true);
    expect(canAccessOrganization(memberOfA, orgB)).toBe(false);
  });

  it('platform admin can access any org', () => {
    expect(canAccessOrganization(platform, orgA)).toBe(true);
    expect(canAccessOrganization(platform, orgB)).toBe(true);
  });

  it('assertCanAccessOrganization throws across tenants', () => {
    expect(() => assertCanAccessOrganization(memberOfA, orgB)).toThrow(TenantIsolationError);
    expect(() => assertCanAccessOrganization(memberOfA, orgA)).not.toThrow();
  });

  it('assertSameTenant guards cross-tenant record pairing', () => {
    expect(() =>
      assertSameTenant({ organizationId: orgA }, { organizationId: orgB }),
    ).toThrow(TenantIsolationError);
    expect(() =>
      assertSameTenant({ organizationId: orgA }, { organizationId: orgA }),
    ).not.toThrow();
  });

  it('organizationScope confines a member to their org', () => {
    expect(organizationScope(memberOfA)).toEqual({ organizationId: orgA });
    // A member may not scope a query to a foreign org even if they ask nicely.
    expect(() => organizationScope(memberOfA, orgB)).toThrow(TenantIsolationError);
  });

  it('organizationScope requires an explicit org for platform admins', () => {
    expect(() => organizationScope(platform)).toThrow(TenantIsolationError);
    expect(organizationScope(platform, orgB)).toEqual({ organizationId: orgB });
  });

  it('filterVisible strips foreign-tenant rows as defense in depth', () => {
    const rows = [
      { id: '1', organizationId: orgA },
      { id: '2', organizationId: orgB },
      { id: '3', organizationId: orgA },
    ];
    expect(filterVisible(memberOfA, rows).map((r) => r.id)).toEqual(['1', '3']);
    expect(filterVisible(platform, rows)).toHaveLength(3);
  });
});
