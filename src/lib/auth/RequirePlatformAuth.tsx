import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ScreenLoader } from '@/components/common/screen-loader';
import { useAppSelector } from '@/store/hooks';

// Platform-scope analogue of RequireAuth — reads platformAuth, not auth. Deliberately not a
// parameterized/shared component: keeping the two guards textually separate means neither can be
// accidentally pointed at the wrong slice by a future edit. See mycondo-docs ADR-019.
interface RequirePlatformAuthProps {
  children: ReactNode;
  fallbackPath?: string;
}

export function RequirePlatformAuth({ children, fallbackPath = '/platform/login' }: RequirePlatformAuthProps) {
  const location = useLocation();
  const { user, isInitialized } = useAppSelector((s) => s.platformAuth);

  if (!isInitialized) {
    return <ScreenLoader />;
  }

  if (!user) {
    return <Navigate to={fallbackPath} state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
