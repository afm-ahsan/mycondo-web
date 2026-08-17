import {
  mycondoApi,
  useDeleteApiV1AuthMeAvatarMutation,
  useGetApiV1AuthMeQuery,
  useLazyGetApiV1TenantsBySlugBySlugQuery,
  usePostApiV1AuthChangePasswordMutation,
  usePostApiV1AuthLoginMutation,
  usePostApiV1AuthLogoutMutation,
  usePostApiV1AuthRefreshMutation,
  usePostApiV1AuthRegisterMutation,
  usePutApiV1AuthMeMutation,
} from '@/api/generated/mycondoApi';
import type { UserProfileDto } from '@/api/generated/mycondoApi';

// Friendlier re-exports of the OpenAPI-generated hooks (ADR-005) — generated operationId-derived
// names aren't meant to be called directly from feature code.
export const useLogin = usePostApiV1AuthLoginMutation;
export const useRegister = usePostApiV1AuthRegisterMutation;
export const useRefreshSession = usePostApiV1AuthRefreshMutation;
export const useLogout = usePostApiV1AuthLogoutMutation;
export const useMyProfile = useGetApiV1AuthMeQuery;
export const useUpdateMyProfile = usePutApiV1AuthMeMutation;
export const useChangePassword = usePostApiV1AuthChangePasswordMutation;
export const useRemoveMyAvatar = useDeleteApiV1AuthMeAvatarMutation;
export const useResolveTenantBySlug = useLazyGetApiV1TenantsBySlugBySlugQuery;

/**
 * Hand-authored: the generated multipart-upload operation types its body as `{ file: Blob }` and
 * would hand that plain object straight to fetchBaseQuery, which JSON-serializes plain objects —
 * never actually sending multipart/form-data. Injected into `mycondoApi` (the generated file's own
 * tag-enhanced instance — see src/api/idempotentEndpoints.ts for the same pattern/rationale against
 * plain baseApi) so `invalidatesTags: ['Auth']` type-checks and actually triggers useMyProfile's
 * auto-refetch. Building real FormData by hand instead. Never edit the generated file to fix this —
 * regenerating would revert it.
 */
// Module-scoped, not per-hook: RTK Query dedupes this query to a single cache entry (no args), so
// there's only ever one live avatar object URL to track regardless of how many components subscribe.
let avatarObjectUrl: string | null = null;

const avatarApi = mycondoApi.injectEndpoints({
  endpoints: (build) => ({
    uploadMyAvatar: build.mutation<UserProfileDto, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return { url: '/api/v1/auth/me/avatar', method: 'POST', body: formData };
      },
      invalidatesTags: ['Auth'],
    }),
    // Avatars are served from an authenticated endpoint, never a public/static path (see
    // UserContextResolver.ResolveAvatarUrl's comment on the backend) — an <img src> can't attach a
    // bearer token, so this fetches the bytes as a blob and immediately converts to an object URL in
    // transformResponse, so only a plain string ever reaches Redux (a Blob fails RTK's
    // isPlainObject serializableCheck). onCacheEntryAdded revokes it once this cache entry (there's
    // only ever one — the query takes no args) is dropped after the last subscriber unmounts;
    // transformResponse revokes the previous URL too, covering the invalidatesTags-driven refetch
    // after upload/remove. Tagged the same as the profile query for that refetch.
    getMyAvatarBlob: build.query<string, void>({
      query: () => ({ url: '/api/v1/auth/me/avatar', responseHandler: (response: Response) => response.blob() }),
      transformResponse: (blob: Blob) => {
        if (avatarObjectUrl) {
          URL.revokeObjectURL(avatarObjectUrl);
        }
        avatarObjectUrl = URL.createObjectURL(blob);
        return avatarObjectUrl;
      },
      providesTags: ['Auth'],
      onCacheEntryAdded: async (_arg, { cacheEntryRemoved }) => {
        await cacheEntryRemoved;
        if (avatarObjectUrl) {
          URL.revokeObjectURL(avatarObjectUrl);
          avatarObjectUrl = null;
        }
      },
    }),
  }),
  overrideExisting: false,
});

export const { useUploadMyAvatarMutation, useGetMyAvatarBlobQuery, useLazyGetMyAvatarBlobQuery } = avatarApi;

// Lives in authSlice.ts — see the comment there for why (avoids a module cycle with baseApi.ts).
export { toAuthUser } from '@/store/slices/authSlice';
