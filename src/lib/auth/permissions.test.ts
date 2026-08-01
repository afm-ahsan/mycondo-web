import { describe, expect, it } from 'vitest';
import type { AuthUser } from '@/store/slices/authSlice';
import { hasPermission, hasPermissionForBuilding } from './permissions';

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    tenantId: 'tenant-1',
    roles: [],
    permissions: [],
    buildingIds: [],
    buildingPermissions: [],
    ...overrides,
  };
}

describe('hasPermission', () => {
  it('returns false when there is no user', () => {
    expect(hasPermission(null, 'role.manage')).toBe(false);
  });

  it('returns true for a tenant-wide grant', () => {
    const user = makeUser({ permissions: ['role.manage'] });
    expect(hasPermission(user, 'role.manage')).toBe(true);
  });

  it('returns false when the permission is not granted', () => {
    const user = makeUser({ permissions: ['role.view'] });
    expect(hasPermission(user, 'role.manage')).toBe(false);
  });
});

describe('hasPermissionForBuilding', () => {
  it('returns true when the permission is granted tenant-wide, regardless of building', () => {
    const user = makeUser({ permissions: ['complaint.manage'] });
    expect(hasPermissionForBuilding(user, 'complaint.manage', 'building-a')).toBe(true);
  });

  it('returns true when granted for that specific building', () => {
    const user = makeUser({
      buildingPermissions: [{ buildingId: 'building-a', permission: 'complaint.manage' }],
    });
    expect(hasPermissionForBuilding(user, 'complaint.manage', 'building-a')).toBe(true);
  });

  it('returns false for a different building than the one granted', () => {
    const user = makeUser({
      buildingPermissions: [{ buildingId: 'building-a', permission: 'complaint.manage' }],
    });
    expect(hasPermissionForBuilding(user, 'complaint.manage', 'building-b')).toBe(false);
  });

  it('returns false when there is no user', () => {
    expect(hasPermissionForBuilding(null, 'complaint.manage', 'building-a')).toBe(false);
  });
});
