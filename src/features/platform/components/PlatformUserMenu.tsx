import { useNavigate } from 'react-router-dom';
import { setPlatformAccessToken } from '@/api/platformBaseApi';
import { toAbsoluteUrl } from '@/lib/helpers';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { platformSessionEnded } from '@/store/slices/platformAuthSlice';
import { AccountMenu } from '@/components/shared/AccountMenu';
import { usePlatformLogout } from '../api/platformAuthApi';

export function PlatformUserMenu() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.platformAuth.user);
  const [logoutMutation, { isLoading: isLoggingOut }] = usePlatformLogout();

  async function logout() {
    try {
      await logoutMutation().unwrap();
    } finally {
      setPlatformAccessToken(null);
      dispatch(platformSessionEnded());
      navigate('/platform/login');
    }
  }

  return (
    <AccountMenu
      trigger={
        <img
          className="size-9 rounded-full border-2 border-green-500 shrink-0 cursor-pointer"
          src={toAbsoluteUrl('/media/avatars/300-2.png')}
          alt="User Avatar"
        />
      }
      displayName={user?.displayName || 'Platform Admin'}
      displayEmail={user?.email || ''}
      avatarUrl={toAbsoluteUrl('/media/avatars/300-2.png')}
      contextLabel="Platform"
      onLogout={logout}
      isLoggingOut={isLoggingOut}
    />
  );
}
