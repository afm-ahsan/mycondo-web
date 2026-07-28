import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { env } from '@/lib/env';
import { sessionEnded } from '@/store/slices/authSlice';
import { ApiError, type ProblemDetails } from './errors';

const ACCESS_TOKEN_HEADER = 'Authorization';
const CORRELATION_HEADER = 'X-Correlation-Id';

// In-memory access token. Refresh token lives in an HttpOnly cookie set by mycondo-api
// (RefreshTokenCookie, scoped to /api/v1/auth) — never touched by JS.
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.VITE_MYCONDO_API_BASE_URL,
  credentials: 'include', // send the mycondo_rt refresh cookie on /api/v1/auth/*
  prepareHeaders: (headers) => {
    if (accessToken) {
      headers.set(ACCESS_TOKEN_HEADER, `Bearer ${accessToken}`);
    }
    if (!headers.has(CORRELATION_HEADER)) {
      headers.set(CORRELATION_HEADER, crypto.randomUUID());
    }
    return headers;
  },
});

// Minimal shape of what this file needs from RootState — kept local rather than importing
// RootState from @/store/store, which itself imports baseApi (avoids a module-graph cycle).
interface PartialAuthState {
  auth?: { user?: { tenantId?: string } | null };
}

// Wraps the fetch base query: on 401 attempt a single refresh, then retry. The refresh call needs a
// tenantId (RefreshRequest — the token itself comes from the cookie) — read the last-known tenant from
// Redux state, since that's what a mid-session token expiry means: there was an active session a
// moment ago. A cold page load's session restore is a separate, explicit call (useSessionBootstrap),
// not this automatic-retry path — there's no prior Redux state to read from yet on first load.
export const baseQueryWithRefresh: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =
  async (args, api, extraOptions) => {
    let result = await rawBaseQuery(args, api, extraOptions);

    if (result.error?.status === 401) {
      const tenantId = (api.getState() as PartialAuthState).auth?.user?.tenantId;

      const refresh = tenantId
        ? await rawBaseQuery(
            { url: '/api/v1/auth/refresh', method: 'POST', body: { tenantId } },
            api,
            extraOptions,
          )
        : { data: undefined };

      if (refresh.data && typeof refresh.data === 'object' && 'accessToken' in refresh.data) {
        setAccessToken((refresh.data as { accessToken: string }).accessToken);
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        setAccessToken(null);
        api.dispatch(sessionEnded());
      }
    }

    if (result.error) {
      const problem = result.error.data as ProblemDetails | undefined;
      if (problem && typeof problem === 'object') {
        const correlationId = readCorrelationId(result.meta?.response);
        const apiError = new ApiError(
          { ...problem, status: problem.status ?? Number(result.error.status) },
          correlationId,
        );
        return { error: { ...result.error, data: apiError } as FetchBaseQueryError };
      }
    }

    return result;
  };

function readCorrelationId(response: Response | undefined): string | undefined {
  return response?.headers.get(CORRELATION_HEADER) ?? undefined;
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithRefresh,
  endpoints: () => ({}),
  tagTypes: [],
});
