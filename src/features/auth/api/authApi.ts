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
    // bearer token, so this fetches the bytes as a blob and the caller turns that into an object URL
    // (see useAvatarUrl) instead of pointing an <img> straight at the API URL. Tagged the same as the
    // profile query so an upload/remove elsewhere refetches the bytes too, not just the URL field.
    getMyAvatarBlob: build.query<Blob, void>({
      query: () => ({ url: '/api/v1/auth/me/avatar', responseHandler: (response: Response) => response.blob() }),
      providesTags: ['Auth'],
    }),
  }),
  overrideExisting: false,
});

export const { useUploadMyAvatarMutation, useGetMyAvatarBlobQuery, useLazyGetMyAvatarBlobQuery } = avatarApi;

// Lives in authSlice.ts — see the comment there for why (avoids a module cycle with baseApi.ts).
export { toAuthUser } from '@/store/slices/authSlice';
