import { type ReactNode } from 'react';
import { useAppSelector } from '@/store/hooks';

interface RequirePermissionProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Hides UI when the current user lacks a permission.
 * IMPORTANT: this is a UX convenience, NOT a security boundary. The backend validates
 * every endpoint via [RequirePermission(...)] independently of what the UI shows.
 *
 * Permission resolution: the JWT carries `roles[]`; the backend resolves them to
 * permissions and emits a `perm` claim per permission. We mirror that here.
 *
 * Phase 3 stub: until the auth slice is wired to actual login, `permissions` is empty
 * and this gate hides everything for unauthenticated users — which is the safe default.
 */
export function RequirePermission({ permission, children, fallback = null }: RequirePermissionProps) {
  const user = useAppSelector((s) => s.auth.user);

  // Phase 3: no permission claims wired yet. Phase 4 will populate from token claims.
  const granted = false;
  void permission;
  void user;

  return granted ? <>{children}</> : <>{fallback}</>;
}
