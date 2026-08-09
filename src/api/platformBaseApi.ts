import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { env } from '@/lib/env';
import { platformSessionEnded } from '@/store/slices/platformAuthSlice';
import { ApiError, type ProblemDetails } from './errors';

// Deliberately a SEPARATE module-level token, base query, and RTK Query API instance from
// src/api/baseApi.ts — not a mode flag on the same one. See mycondo-docs ADR-019 and the approved
// Phase 1 blueprint §3/§6: a Platform session must never be able to masquerade as, overwrite, or be
// silently mixed with a tenant session's in-memory access token or auto-refresh-on-401 logic (which
// for the tenant API reads `auth.user.tenantId` from Redux — meaningless, and actively wrong, for a
// Platform-scope 401).
const ACCESS_TOKEN_HEADER = 'Authorization';
const CORRELATION_HEADER = 'X-Correlation-Id';

let platformAccessToken: string | null = null;

export function setPlatformAccessToken(token: string | null): void {
  platformAccessToken = token;
}

export function getPlatformAccessToken(): string | null {
  return platformAccessToken;
}

const rawPlatformBaseQuery = fetchBaseQuery({
  baseUrl: env.VITE_MYCONDO_API_BASE_URL,
  credentials: 'include', // sends the mycondo_platform_rt cookie on /api/v1/platform/auth/* only —
  // the browser scopes it by the cookie's own Path, so this never sends the tenant mycondo_rt cookie.
  prepareHeaders: (headers) => {
    if (platformAccessToken) {
      headers.set(ACCESS_TOKEN_HEADER, `Bearer ${platformAccessToken}`);
    }
    if (!headers.has(CORRELATION_HEADER)) {
      headers.set(CORRELATION_HEADER, crypto.randomUUID());
    }
    return headers;
  },
});

export const platformBaseQueryWithRefresh: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =
  async (args, api, extraOptions) => {
    let result = await rawPlatformBaseQuery(args, api, extraOptions);

    if (result.error?.status === 401) {
      // No body needed — the platform refresh endpoint reads the token from the
      // mycondo_platform_rt cookie only, unlike the tenant refresh call (which still needs an
      // explicit tenantId; see baseApi.ts). There is no Platform equivalent of "which tenant" to read.
      const refresh = await rawPlatformBaseQuery(
        { url: '/api/v1/platform/auth/refresh', method: 'POST' },
        api,
        extraOptions,
      );

      if (refresh.data && typeof refresh.data === 'object' && 'accessToken' in refresh.data) {
        setPlatformAccessToken((refresh.data as { accessToken: string }).accessToken);
        result = await rawPlatformBaseQuery(args, api, extraOptions);
      } else {
        setPlatformAccessToken(null);
        api.dispatch(platformSessionEnded());
      }
    }

    if (result.error) {
      const problem = result.error.data as ProblemDetails | undefined;
      if (problem && typeof problem === 'object') {
        const correlationId = result.meta?.response?.headers.get(CORRELATION_HEADER) ?? undefined;
        const apiError = new ApiError(
          { ...problem, status: problem.status ?? Number(result.error.status) },
          correlationId,
        );
        return { error: { ...result.error, data: apiError } as FetchBaseQueryError };
      }
    }

    return result;
  };

export const platformBaseApi = createApi({
  reducerPath: 'platformApi',
  baseQuery: platformBaseQueryWithRefresh,
  endpoints: () => ({}),
});
