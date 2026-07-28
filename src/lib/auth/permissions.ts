import type { AuthUser } from '@/store/slices/authSlice';

/**
 * Mirrors the backend's ICurrentUserProvider.HasPermission/HasPermissionForBuilding
 * (mycondo-api/src/MyCondo.Api/Authentication/CurrentUserProvider.cs, ADR-011/ADR-014): a tenant-wide
 * grant always passes regardless of building; otherwise a building-scoped grant only applies to that
 * specific building. This is a UX convenience, not a security boundary — see RequirePermission.tsx.
 */
export function hasPermission(user: AuthUser | null, permission: string): boolean {
  return user?.permissions.includes(permission) ?? false;
}

export function hasPermissionForBuilding(
  user: AuthUser | null,
  permission: string,
  buildingId: string,
): boolean {
  if (hasPermission(user, permission)) {
    return true;
  }
  return (
    user?.buildingPermissions.some(
      (grant) => grant.buildingId === buildingId && grant.permission === permission,
    ) ?? false
  );
}
