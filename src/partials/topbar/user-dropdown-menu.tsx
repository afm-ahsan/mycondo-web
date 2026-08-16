import { setAccessToken } from '@/api/baseApi';
import { useLogout } from '@/features/auth/api/authApi';
import { clearPersistedTenantId } from '@/features/auth/lib/tenantSession';
import { useAvatarUrl } from '@/features/me/hooks/useAvatarUrl';
import { useNavigate } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { sessionEnded } from '@/store/slices/authSlice';
import { AccountMenu } from '@/components/shared/AccountMenu';

const FALLBACK_AVATAR = toAbsoluteUrl('/media/avatars/blank.png');

/**
 * Renders its own trigger (rather than accepting one) so the small header avatar icon reads from
 * the same auth-state/blob source as the identity block inside AccountMenu — previously Header hard
 * coded a static demo image here, which is why it never picked up profile-photo changes.
 */
export function UserDropdownMenu() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const [logoutMutation, { isLoading: isLoggingOut }] = useLogout();
  const uploadedAvatarUrl = useAvatarUrl(Boolean(user?.avatarUrl));

  const displayName = user?.name || 'User';
  const displayEmail = user?.email || '';
  const displayAvatar = uploadedAvatarUrl ?? FALLBACK_AVATAR;

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
      trigger={
        <img
          className="size-9 rounded-full border-2 border-green-500 shrink-0 cursor-pointer"
          src={displayAvatar}
          alt="User Avatar"
        />
      }
      displayName={displayName}
      displayEmail={displayEmail}
      avatarUrl={displayAvatar}
      profileHref="/me/profile"
      onLogout={logout}
      isLoggingOut={isLoggingOut}
    />
  );
}
