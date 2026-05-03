import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { env } from '@/lib/env';
import { ApiError, type ProblemDetails } from './errors';

const ACCESS_TOKEN_HEADER = 'Authorization';
const CORRELATION_HEADER = 'X-Correlation-Id';

// In-memory access token. Refresh token lives in an HttpOnly cookie set by mycondo-api.
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.VITE_MYCONDO_API_BASE_URL,
  credentials: 'include', // send refresh-token cookie on /auth/refresh
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

// Wraps the fetch base query: on 401 attempt a single refresh, then retry.
export const baseQueryWithRefresh: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =
  async (args, api, extraOptions) => {
    let result = await rawBaseQuery(args, api, extraOptions);

    if (result.error?.status === 401) {
      const refresh = await rawBaseQuery(
        { url: '/api/auth/refresh', method: 'POST' },
        api,
        extraOptions,
      );

      if (refresh.data && typeof refresh.data === 'object' && 'accessToken' in refresh.data) {
        setAccessToken((refresh.data as { accessToken: string }).accessToken);
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        setAccessToken(null);
        // Caller can read this error and route to /login.
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
