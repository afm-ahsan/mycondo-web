import {
  useGetApiV1AuthMeQuery,
  useLazyGetApiV1TenantsBySlugBySlugQuery,
  usePostApiV1AuthLoginMutation,
  usePostApiV1AuthLogoutMutation,
  usePostApiV1AuthRefreshMutation,
  usePostApiV1AuthRegisterMutation,
} from '@/api/generated/mycondoApi';

// Friendlier re-exports of the OpenAPI-generated hooks (ADR-005) — generated operationId-derived
// names aren't meant to be called directly from feature code.
export const useLogin = usePostApiV1AuthLoginMutation;
export const useRegister = usePostApiV1AuthRegisterMutation;
export const useRefreshSession = usePostApiV1AuthRefreshMutation;
export const useLogout = usePostApiV1AuthLogoutMutation;
export const useMyProfile = useGetApiV1AuthMeQuery;
export const useResolveTenantBySlug = useLazyGetApiV1TenantsBySlugBySlugQuery;

// Lives in authSlice.ts — see the comment there for why (avoids a module cycle with baseApi.ts).
export { toAuthUser } from '@/store/slices/authSlice';
