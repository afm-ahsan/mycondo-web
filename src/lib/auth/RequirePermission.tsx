import { type ReactNode } from 'react';
import { useAppSelector } from '@/store/hooks';
import { hasPermission, hasPermissionForBuilding } from './permissions';

interface RequirePermissionProps {
  permission: string;
  /** Omit for a tenant-wide check; pass to also allow a building-scoped grant for this building. */
  buildingId?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Hides UI when the current user lacks a permission.
 * IMPORTANT: this is a UX convenience, NOT a security boundary. The backend validates
 * every endpoint via [RequirePermission(...)] independently of what the UI shows.
 *
 * Permission resolution: the JWT carries `perm`/`bperm` claims (ADR-011/ADR-014); the Login/Refresh
 * response body already surfaces them as `permissions`/`buildingPermissions` on AuthUser (see
 * authSlice.ts) — no client-side claim parsing needed.
 */
export function RequirePermission({
  permission,
  buildingId,
  children,
  fallback = null,
}: RequirePermissionProps) {
  const user = useAppSelector((s) => s.auth.user);

  const granted = buildingId
    ? hasPermissionForBuilding(user, permission, buildingId)
    : hasPermission(user, permission);

  return granted ? <>{children}</> : <>{fallback}</>;
}
