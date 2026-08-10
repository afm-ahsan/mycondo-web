import { platformBaseApi } from '@/api/platformBaseApi';
import type {
  PlatformAuthenticatedUserDto,
  PlatformAuthResponse as PlatformAuthResponseDto,
  PlatformLoginCommand as PlatformLoginRequest,
} from '@/api/generated/mycondoApi';
import type { PlatformAuthUser } from '@/store/slices/platformAuthSlice';

// Endpoint definitions here are hand-authored, not generated — deliberately, not temporarily. The
// OpenAPI codegen pipeline (openapi-config.js) only targets one `apiImport` (src/api/baseApi.ts), and
// the whole point of platformBaseApi.ts is that Platform requests must use a completely separate
// in-memory access token and a separate refresh-on-401 code path from the tenant one (see its doc
// comment and mycondo-docs ADR-019) — wiring these endpoints into the generated `mycondoApi` client
// would silently route them through baseApi's tenant-flavored token/refresh logic, undoing that
// isolation. This is the "authentication transport intentionally handled outside generated clients"
// case anticipated by mycondo-phase1-final-postgresql-rls-verification-prompt.md's OpenAPI
// reconciliation step.
//
// The wire-shape *types* are NOT hand-duplicated, though — they're imported from the generated client
// (confirmed structurally identical on comparison), so this file can't silently drift from the actual
// backend contract the way a fully hand-authored set of interfaces could.
export type { PlatformAuthenticatedUserDto, PlatformAuthResponseDto, PlatformLoginRequest };

export function toPlatformAuthUser(dto: PlatformAuthenticatedUserDto): PlatformAuthUser {
  return {
    id: dto.platformUserId,
    email: dto.email,
    displayName: dto.displayName,
    roles: dto.roles,
    permissions: dto.permissions,
  };
}

const injectedPlatformAuthApi = platformBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    platformLogin: builder.mutation<PlatformAuthResponseDto, PlatformLoginRequest>({
      query: (body) => ({ url: '/api/v1/platform/auth/login', method: 'POST', body }),
    }),
    platformRefresh: builder.mutation<PlatformAuthResponseDto, void>({
      query: () => ({ url: '/api/v1/platform/auth/refresh', method: 'POST' }),
    }),
    platformLogout: builder.mutation<void, void>({
      query: () => ({ url: '/api/v1/platform/auth/logout', method: 'POST' }),
    }),
  }),
});

export const {
  usePlatformLoginMutation: usePlatformLogin,
  usePlatformRefreshMutation: usePlatformRefresh,
  usePlatformLogoutMutation: usePlatformLogout,
} = injectedPlatformAuthApi;
