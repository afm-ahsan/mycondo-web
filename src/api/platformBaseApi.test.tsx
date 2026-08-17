import type { ReactNode } from 'react';
import { HttpResponse, http } from 'msw';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { createStore } from '@/store/store';
import { getAccessToken, setAccessToken } from '@/api/baseApi';
import { ApiError, toApiError } from '@/api/errors';
import { getPlatformAccessToken, setPlatformAccessToken } from './platformBaseApi';
import { usePlatformLogin, usePlatformLogout } from '../features/platform/api/platformAuthApi';
import { hasPlatformSessionHint, markPlatformSessionActive } from '../features/platform/lib/platformSession';

const API_BASE = 'https://localhost:7219';

function wrapper({ children }: { children: ReactNode }) {
  const store = createStore();
  return <Provider store={store}>{children}</Provider>;
}

afterEach(() => {
  sessionStorage.clear();
  setPlatformAccessToken(null);
  setAccessToken(null);
});

describe('platformBaseQueryWithRefresh — serialization safety', () => {
  it('attaches a plain, JSON-serializable error payload instead of an ApiError instance', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/platform/auth/login`, () =>
        HttpResponse.json(
          { title: 'Validation failed', status: 400, errors: { Email: ['Email is required.'] } },
          { status: 400 },
        ),
      ),
    );

    const { result } = renderHook(() => usePlatformLogin(), { wrapper });
    const [login] = result.current;

    let caught: unknown;
    await act(async () => {
      try {
        await login({ email: '', password: '' }).unwrap();
      } catch (err) {
        caught = err;
      }
    });

    const data = (caught as { data?: unknown })?.data;
    expect(data).not.toBeInstanceOf(ApiError);
    expect(() => JSON.stringify(data)).not.toThrow();
    expect(JSON.parse(JSON.stringify(data))).toEqual(data);

    const apiError = toApiError(caught);
    expect(apiError?.isValidation).toBe(true);
    expect(apiError?.errors?.Email?.[0]).toBe('Email is required.');
  });
});

describe('platformBaseQueryWithRefresh — refresh guard on 401', () => {
  it('does not call /platform/auth/refresh when no session hint exists, and never touches tenant auth state', async () => {
    setAccessToken('tenant-token-untouched');
    let refreshCalled = false;
    server.use(
      http.post(`${API_BASE}/api/v1/platform/auth/logout`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${API_BASE}/api/v1/platform/auth/refresh`, () => {
        refreshCalled = true;
        return HttpResponse.json(
          { title: 'Validation failed', status: 400, errors: { RefreshToken: ["'Refresh Token' must not be empty."] } },
          { status: 400 },
        );
      }),
    );

    const { result } = renderHook(() => usePlatformLogout(), { wrapper });
    const [logout] = result.current;

    await act(async () => {
      await logout().unwrap().catch(() => undefined);
    });

    expect(refreshCalled).toBe(false);
    expect(hasPlatformSessionHint()).toBe(false);
    expect(getAccessToken()).toBe('tenant-token-untouched');
  });

  it('refreshes once on 401 when a session hint exists, then retries the original request', async () => {
    markPlatformSessionActive();
    let refreshCalls = 0;
    let logoutCalls = 0;
    server.use(
      http.post(`${API_BASE}/api/v1/platform/auth/logout`, () => {
        logoutCalls += 1;
        return logoutCalls === 1
          ? new HttpResponse(null, { status: 401 })
          : new HttpResponse(null, { status: 204 });
      }),
      http.post(`${API_BASE}/api/v1/platform/auth/refresh`, () => {
        refreshCalls += 1;
        return HttpResponse.json({
          accessToken: 'rotated-platform-access-token',
          accessTokenExpiresAtUtc: new Date().toISOString(),
          user: {
            platformUserId: 'platform-user-1',
            email: 'sadmin@mycondo.com',
            displayName: 'Platform SuperAdmin',
            roles: ['SuperAdmin'],
            permissions: [],
          },
        });
      }),
    );

    const { result } = renderHook(() => usePlatformLogout(), { wrapper });
    const [logout] = result.current;

    await act(async () => {
      await logout().unwrap();
    });

    await waitFor(() => {
      expect(refreshCalls).toBe(1);
    });
    expect(logoutCalls).toBe(2);
    expect(getPlatformAccessToken()).toBe('rotated-platform-access-token');
  });
});
