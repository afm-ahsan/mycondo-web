import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ScreenLoader } from '@/components/common/screen-loader';
import { useAppSelector } from '@/store/hooks';

interface RequireAuthProps {
  children: ReactNode;
  fallbackPath?: string;
}

export function RequireAuth({ children, fallbackPath = '/login' }: RequireAuthProps) {
  const location = useLocation();
  const { user, isInitialized } = useAppSelector((s) => s.auth);

  if (!isInitialized) {
    return <ScreenLoader />;
  }

  if (!user) {
    return <Navigate to={fallbackPath} state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
