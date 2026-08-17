import { useGetMyAvatarBlobQuery } from '@/features/auth/api/authApi';

/**
 * Avatars are served from an authenticated endpoint (never a public/static path — see
 * UserContextResolver.ResolveAvatarUrl on the backend), so a plain `<img src>` can't reach it: img
 * tags can't attach the bearer token, and the token is never put in a URL. getMyAvatarBlob fetches the
 * bytes and hands back a local object URL (see its comment for the create/revoke lifecycle) instead of
 * the raw bytes, so this hook is just a thin, friendlier wrapper around the query.
 */
export function useAvatarUrl(hasAvatar: boolean): string | null {
  const { data: objectUrl } = useGetMyAvatarBlobQuery(undefined, { skip: !hasAvatar });
  return objectUrl ?? null;
}
