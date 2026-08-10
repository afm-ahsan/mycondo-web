import { type ReactNode } from 'react';
import { useAppSelector } from '@/store/hooks';
import { hasPlatformPermission } from './platformPermissions';

interface RequirePlatformPermissionProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Hides UI when the current Platform SuperAdmin lacks a permission. Platform-scope analogue of
 * RequirePermission.tsx — reads platformAuth, not auth (see RequirePlatformAuth.tsx's doc comment
 * for why these stay textually separate).
 * IMPORTANT: this is a UX convenience, NOT a security boundary — the backend independently enforces
 * every Platform endpoint via RequirePlatformPermission(...).
 */
export function RequirePlatformPermission({
  permission,
  children,
  fallback = null,
}: RequirePlatformPermissionProps) {
  const user = useAppSelector((s) => s.platformAuth.user);

  return hasPlatformPermission(user, permission) ? <>{children}</> : <>{fallback}</>;
}
