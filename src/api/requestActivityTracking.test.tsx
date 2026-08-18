import type { ReactNode } from 'react';
import { HttpResponse, delay, http } from 'msw';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { createStore } from '@/store/store';
import { setAccessToken } from '@/api/baseApi';
import { setPlatformAccessToken } from '@/api/platformBaseApi';
import { useLogin, useMyProfile } from '@/features/auth/api/authApi';
import { usePlatformLogin } from '@/features/platform/api/platformAuthApi';
import {
  getActiveHttpOperation,
  getActiveHttpRequestCount,
  resetHttpRequestActivityForTests,
} from '@/lib/http/requestActivityTracker';
import type { AuthUser } from '@/store/slices/authSlice';

/**
 * Verifies baseQueryWithRefresh (baseApi.ts) and platformBaseQueryWithRefresh (platformBaseApi.ts) —
 * the two choke points every application HTTP call funnels through — actually drive the shared global
 * request counter that the loader (global-http-loader.tsx) renders from. Unit coverage for the counter
 * itself lives in src/lib/http/requestActivityTracker.test.ts.
 */

const API_BASE = 'https://localhost:7219';

function wrapper({ children }: { children: ReactNode }) {
  const store = createStore();
  return <Provider store={store}>{children}</Provider>;
}

function ProfileHarness() {
  useMyProfile();
  return <span>profile harness</span>;
}

const staleUser: AuthUser = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Admin User',
  tenantId: 'tenant-1',
  roles: ['BuildingAdmin'],
  permissions: [],
  buildingIds: [],
  buildingPermissions: [],
};

afterEach(() => {
  resetHttpRequestActivityForTests();
  setAccessToken(null);
  setPlatformAccessToken(null);
});

describe('request activity tracking — tenant baseQueryWithRefresh', () => {
  it('increments while the request is in flight and decrements once it resolves', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/auth/login`, async () => {
        await delay(30);
        return HttpResponse.json({
          accessToken: 'tok',
          accessTokenExpiresAtUtc: new Date().toISOString(),
          user: { userId: 'u1', tenantId: 'tenant-1', email: 'a@x.com', fullName: 'A' },
        });
      }),
    );

    const { result } = renderHook(() => useLogin(), { wrapper });
    const [login] = result.current;

    expect(getActiveHttpRequestCount()).toBe(0);

    let pending: Promise<unknown> | undefined;
    act(() => {
      pending = login({ loginCommand: { tenantId: 'tenant-1', email: 'a@x.com', password: 'x' } }).unwrap();
    });

    await waitFor(() => expect(getActiveHttpRequestCount()).toBe(1));
    // Login is a session-lifecycle call with its own button spinner — it must still block interaction
    // via activeRequestCount (HttpInertBoundary), but must never surface as an operation GlobalHttpLoader
    // would render a floating "Loading…" pill for (see mycondo-web loader spec "Authentication Is Not
    // Saving" and "Session-Lifecycle Calls Are Silent").
    expect(getActiveHttpOperation()).toBeNull();

    await act(async () => {
      await pending;
    });

    expect(getActiveHttpRequestCount()).toBe(0);
  });

  it('releases the counter after a failed request', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/auth/login`, () =>
        HttpResponse.json({ title: 'Unauthorized', status: 401, detail: 'Invalid credentials' }, { status: 401 }),
      ),
    );

    const { result } = renderHook(() => useLogin(), { wrapper });
    const [login] = result.current;

    await act(async () => {
      await login({ loginCommand: { tenantId: 'tenant-1', email: 'bad@x.com', password: 'wrong' } })
        .unwrap()
        .catch(() => undefined);
    });

    expect(getActiveHttpRequestCount()).toBe(0);
  });

  it('tracks the full 401 refresh-and-retry cycle as one outstanding request, then clears it', async () => {
    setAccessToken('stale-access-token');
    let meCalls = 0;
    server.use(
      http.get(`${API_BASE}/api/v1/auth/me`, async () => {
        meCalls += 1;
        await delay(15);
        if (meCalls === 1) {
          return HttpResponse.json({ title: 'Unauthorized', status: 401 }, { status: 401 });
        }
        return HttpResponse.json({ userId: 'u1', email: 'admin@example.com', fullName: 'Admin User' });
      }),
      http.post(`${API_BASE}/api/v1/auth/refresh`, async () => {
        await delay(15);
        return HttpResponse.json({
          accessToken: 'fresh-access-token',
          accessTokenExpiresAtUtc: new Date().toISOString(),
          user: { userId: 'u1', tenantId: 'tenant-1', email: 'admin@example.com', fullName: 'Admin User' },
        });
      }),
    );

    renderWithProviders(<ProfileHarness />, { auth: { user: staleUser, isInitialized: true } });

    // Three raw fetches happen underneath (original -> refresh -> retry), but the counter must move
    // once per RTK Query call, never past 1, for this single logical operation.
    await waitFor(() => expect(getActiveHttpRequestCount()).toBe(1));
    await waitFor(() => expect(meCalls).toBe(2));
    await waitFor(() => expect(getActiveHttpRequestCount()).toBe(0));
  });

  it('stays visible across two concurrent requests, clearing only once both finish', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/auth/login`, async ({ request }) => {
        const body = (await request.json()) as { email: string };
        await delay(body.email === 'fast@example.com' ? 15 : 60);
        return HttpResponse.json({
          accessToken: `tok-${body.email}`,
          accessTokenExpiresAtUtc: new Date().toISOString(),
          user: { userId: 'u1', tenantId: 'tenant-1', email: body.email, fullName: 'A' },
        });
      }),
    );

    const { result } = renderHook(() => useLogin(), { wrapper });
    const [login] = result.current;

    let fast: Promise<unknown> | undefined;
    let slow: Promise<unknown> | undefined;
    act(() => {
      fast = login({ loginCommand: { tenantId: 'tenant-1', email: 'fast@example.com', password: 'x' } }).unwrap();
      slow = login({ loginCommand: { tenantId: 'tenant-1', email: 'slow@example.com', password: 'x' } }).unwrap();
    });

    await waitFor(() => expect(getActiveHttpRequestCount()).toBe(2));

    await act(async () => {
      await fast;
    });
    // The faster request settled — the slower one is still outstanding, so the counter (and the
    // loader it drives) must not drop to zero yet.
    expect(getActiveHttpRequestCount()).toBe(1);

    await act(async () => {
      await slow;
    });
    expect(getActiveHttpRequestCount()).toBe(0);
  });
});

describe('request activity tracking — platform platformBaseQueryWithRefresh', () => {
  it('drives the same shared counter as the tenant base query', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/platform/auth/login`, async () => {
        await delay(20);
        return HttpResponse.json({
          accessToken: 'platform-tok',
          accessTokenExpiresAtUtc: new Date().toISOString(),
          user: { platformUserId: 'p1', email: 'p@x.com', displayName: 'P', roles: [], permissions: [] },
        });
      }),
    );

    const { result } = renderHook(() => usePlatformLogin(), { wrapper });
    const [login] = result.current;

    let pending: Promise<unknown> | undefined;
    act(() => {
      pending = login({ email: 'p@x.com', password: 'x' }).unwrap();
    });

    await waitFor(() => expect(getActiveHttpRequestCount()).toBe(1));
    expect(getActiveHttpOperation()).toBeNull();

    await act(async () => {
      await pending;
    });

    expect(getActiveHttpRequestCount()).toBe(0);
  });
});
