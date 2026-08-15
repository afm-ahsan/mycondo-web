import { useEffect, useState } from 'react';
import { useGetMyAvatarBlobQuery } from '@/features/auth/api/authApi';

/**
 * Avatars are served from an authenticated endpoint (never a public/static path — see
 * UserContextResolver.ResolveAvatarUrl on the backend), so a plain `<img src>` can't reach it: img
 * tags can't attach the bearer token, and the token is never put in a URL. Fetches the bytes as a
 * blob instead and hands back a local object URL, revoked on cleanup/change.
 */
export function useAvatarUrl(hasAvatar: boolean): string | null {
  const { data: blob } = useGetMyAvatarBlobQuery(undefined, { skip: !hasAvatar });
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(blob);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  return objectUrl;
}
