import { describe, expect, it } from 'vitest';
import {
  ADMIN_ROLES,
  can,
  canAll,
  canAny,
  isOrganizationRole,
  isPlatformAdmin,
  isRole,
  ROLE_PERMISSIONS,
} from './roles';

describe('roles & permissions', () => {
  it('platform super admin holds every permission', () => {
    for (const perm of ROLE_PERMISSIONS.PLATFORM_SUPER_ADMIN) {
      expect(can('PLATFORM_SUPER_ADMIN', perm)).toBe(true);
    }
    expect(can('PLATFORM_SUPER_ADMIN', 'platform:admin')).toBe(true);
    expect(can('PLATFORM_SUPER_ADMIN', 'org:verify')).toBe(true);
  });

  it('organization owner can manage members but is not a platform admin', () => {
    expect(can('ORGANIZATION_OWNER', 'org:members:manage')).toBe(true);
    expect(can('ORGANIZATION_OWNER', 'org:manage')).toBe(true);
    expect(can('ORGANIZATION_OWNER', 'platform:admin')).toBe(false);
    expect(can('ORGANIZATION_OWNER', 'org:verify')).toBe(false);
  });

  it('organization admin can send messages but cannot manage members or billing', () => {
    expect(canAll('ORGANIZATION_ADMIN', ['messages:create', 'messages:send'])).toBe(true);
    expect(can('ORGANIZATION_ADMIN', 'org:members:manage')).toBe(false);
    expect(can('ORGANIZATION_ADMIN', 'org:billing:manage')).toBe(false);
  });

  it('content editor may create/edit messages but never send or manage billing/security', () => {
    expect(canAll('CONTENT_EDITOR', ['messages:create', 'messages:edit'])).toBe(true);
    expect(can('CONTENT_EDITOR', 'messages:send')).toBe(false);
    expect(can('CONTENT_EDITOR', 'org:billing:manage')).toBe(false);
    expect(can('CONTENT_EDITOR', 'org:members:manage')).toBe(false);
    expect(can('CONTENT_EDITOR', 'subscribers:manage')).toBe(false);
  });

  it('analyst is read-only on analytics', () => {
    expect(can('ANALYST', 'analytics:read')).toBe(true);
    expect(canAny('ANALYST', ['messages:send', 'subscribers:manage', 'channels:manage'])).toBe(
      false,
    );
  });

  it('subscriber has no admin permissions at all', () => {
    expect(ROLE_PERMISSIONS.SUBSCRIBER.size).toBe(0);
    expect(canAny('SUBSCRIBER', ['messages:read', 'analytics:read'])).toBe(false);
  });

  it('classifies roles', () => {
    expect(isPlatformAdmin('PLATFORM_SUPER_ADMIN')).toBe(true);
    expect(isPlatformAdmin('ORGANIZATION_OWNER')).toBe(false);
    expect(isOrganizationRole('CONTENT_EDITOR')).toBe(true);
    expect(isOrganizationRole('SUBSCRIBER')).toBe(false);
    expect(ADMIN_ROLES).not.toContain('SUBSCRIBER');
  });

  it('validates role strings', () => {
    expect(isRole('ANALYST')).toBe(true);
    expect(isRole('root')).toBe(false);
    expect(isRole(42)).toBe(false);
  });
});
