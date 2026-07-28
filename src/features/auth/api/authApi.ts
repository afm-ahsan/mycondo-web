import type { AuthenticatedUserDto } from '@/api/generated/mycondoApi';
import {
  useGetApiV1AuthMeQuery,
  useLazyGetApiV1TenantsBySlugBySlugQuery,
  usePostApiV1AuthLoginMutation,
  usePostApiV1AuthLogoutMutation,
  usePostApiV1AuthRefreshMutation,
  usePostApiV1AuthRegisterMutation,
} from '@/api/generated/mycondoApi';
import type { AuthUser } from '@/store/slices/authSlice';

// Friendlier re-exports of the OpenAPI-generated hooks (ADR-005) — generated operationId-derived
// names aren't meant to be called directly from feature code.
export const useLogin = usePostApiV1AuthLoginMutation;
export const useRegister = usePostApiV1AuthRegisterMutation;
export const useRefreshSession = usePostApiV1AuthRefreshMutation;
export const useLogout = usePostApiV1AuthLogoutMutation;
export const useMyProfile = useGetApiV1AuthMeQuery;
export const useResolveTenantBySlug = useLazyGetApiV1TenantsBySlugBySlugQuery;

/** Maps the wire DTO (Login/Register/Refresh response's `user` field) to Redux's AuthUser shape. */
export function toAuthUser(dto: AuthenticatedUserDto): AuthUser {
  return {
    id: dto.userId,
    email: dto.email,
    name: dto.fullName,
    tenantId: dto.tenantId,
    roles: dto.roles,
    permissions: dto.permissions,
    buildingIds: dto.buildingIds,
    buildingPermissions: dto.buildingPermissions,
  };
}
