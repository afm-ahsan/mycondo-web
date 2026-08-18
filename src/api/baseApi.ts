import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { env } from '@/lib/env';
import { type AppFetchArgs, isSilentHttpRequest, resolveHttpOperation, stripOperation } from '@/lib/http/httpOperation';
import { beginHttpRequest, endHttpRequest } from '@/lib/http/requestActivityTracker';
import { sessionEnded, sessionRestored, toAuthUser } from '@/store/slices/authSlice';
import type { AuthResponse } from './generated/mycondoApi';
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
export const baseQueryWithRefresh: BaseQueryFn<string | AppFetchArgs, unknown, FetchBaseQueryError> =
  async (args, api, extraOptions) => {
    // Tracked as a single logical HTTP operation for the global loader (see requestActivityTracker.ts
    // and httpOperation.ts) even though a 401 below can fan this out into up to three raw fetches
    // (original, refresh, retry) — the counter must move once per RTK Query call, not once per
    // underlying network round-trip.
    const operation = resolveHttpOperation(args);
    const silent = isSilentHttpRequest(args);
    // Strip our own `operation` field before handing off to fetchBaseQuery — it isn't a real FetchArgs
    // member, and fetchBaseQuery spreads unrecognized args straight into the RequestInit passed to
    // fetch().
    const rawArgs = typeof args === 'string' ? args : stripOperation(args);
    beginHttpRequest(operation, silent);
    try {
      let result = await rawBaseQuery(rawArgs, api, extraOptions);

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
          const { accessToken: newAccessToken, user } = refresh.data as AuthResponse;
          setAccessToken(newAccessToken);
          // Without this, a tab left open across an access-token expiry keeps working (the token
          // itself is fresh) but Redux's `auth.user.permissions` stays frozen at whatever it was at
          // last login/reload — a role/permission grant change server-side (e.g. a newly-granted
          // permission) would never reach the permission-gated UI until a hard reload or re-login.
          api.dispatch(sessionRestored(toAuthUser(user)));
          result = await rawBaseQuery(rawArgs, api, extraOptions);
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
          return { error: { ...result.error, data: apiError.toPayload() } as FetchBaseQueryError };
        }
      }

      return result;
    } finally {
      endHttpRequest(operation, silent);
    }
  };

function readCorrelationId(response: Response | undefined): string | undefined {
  return response?.headers.get(CORRELATION_HEADER) ?? undefined;
}

// The generated client (src/api/generated/mycondoApi.ts) doesn't use RTK Query's cache-tag
// invalidation system at all (its own `tag: true` codegen option only groups hooks by OpenAPI tag
// name, unrelated to this). These tag types exist solely for src/api/idempotentEndpoints.ts's
// hand-authored mutations, which do use providesTags/invalidatesTags — never removed even though
// tsc -b (see mycondo-web/CLAUDE.md) never actually checked this file's tags for real were it not
// declared here.
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithRefresh,
  endpoints: () => ({}),
  tagTypes: ['Payments', 'Invoices', 'ResidentAccounts', 'Readings', 'Facility Bookings'],
});
