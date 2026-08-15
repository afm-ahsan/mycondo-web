import { ReactNode } from 'react';
import { setAccessToken } from '@/api/baseApi';
import { useLogout } from '@/features/auth/api/authApi';
import { clearPersistedTenantId } from '@/features/auth/lib/tenantSession';
import { useNavigate } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { sessionEnded } from '@/store/slices/authSlice';
import { AccountMenu } from '@/components/shared/AccountMenu';

export function UserDropdownMenu({ trigger }: { trigger: ReactNode }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const [logoutMutation, { isLoading: isLoggingOut }] = useLogout();

  const displayName = user?.name || 'User';
  const displayEmail = user?.email || '';
  const displayAvatar = toAbsoluteUrl('/media/avatars/300-2.png');

  async function logout() {
    try {
      await logoutMutation().unwrap();
    } finally {
      setAccessToken(null);
      clearPersistedTenantId();
      dispatch(sessionEnded());
      navigate('/login');
    }
  }

  return (
    <AccountMenu
      trigger={trigger}
      displayName={displayName}
      displayEmail={displayEmail}
      avatarUrl={displayAvatar}
      onLogout={logout}
      isLoggingOut={isLoggingOut}
    />
  );
}
