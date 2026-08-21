import { HttpResponse, http } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { useAppSelector } from '@/store/hooks';
import { setAccessToken } from '@/api/baseApi';
import { useMyProfile } from '@/features/auth/api/authApi';
import type { AuthUser } from '@/store/slices/authSlice';
import { persistTenantId, readPersistedTenantId } from '@/features/auth/lib/tenantSession';

const API_BASE = 'https://localhost:7219';

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

const refreshedUserDto = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  email: 'admin@example.com',
  fullName: 'Admin User',
  roles: ['BuildingAdmin'],
  permissions: ['expensetype.view'],
  buildingIds: [],
  buildingPermissions: [],
};

function Harness() {
  useMyProfile();
  const permissions = useAppSelector((s) => s.auth.user?.permissions ?? []);
  return <span>permissions: {permissions.join(',') || '(none)'}</span>;
}

afterEach(() => {
  setAccessToken(null);
  sessionStorage.clear();
});

describe('baseQueryWithRefresh — silent 401 refresh mid-session', () => {
  it('updates Redux auth.user.permissions from the refresh response, not just the access token', async () => {
    // Simulates a role/permission grant added server-side after this tab's last real login/reload —
    // the access token is still "valid enough" to have been attached, but the API rejects it (expired),
    // triggering the silent refresh path in baseApi.ts rather than useSessionBootstrap's cold-boot path.
    setAccessToken('stale-access-token');

    let meCallCount = 0;
    server.use(
      http.get(`${API_BASE}/api/v1/auth/me`, () => {
        meCallCount += 1;
        if (meCallCount === 1) {
          return HttpResponse.json(
            { title: 'Unauthorized', status: 401, detail: 'Access token expired.' },
            { status: 401 },
          );
        }
        return HttpResponse.json({ userId: 'user-1', email: 'admin@example.com', fullName: 'Admin User' });
      }),
      http.post(`${API_BASE}/api/v1/auth/refresh`, () =>
        HttpResponse.json({
          accessToken: 'fresh-access-token',
          accessTokenExpiresAtUtc: new Date().toISOString(),
          user: refreshedUserDto,
        }),
      ),
    );

    const { store } = renderWithProviders(<Harness />, {
      auth: { user: staleUser, isInitialized: true },
    });

    // Before the fix, this stayed frozen at the pre-refresh `staleUser.permissions` ([]) forever —
    // the silent-refresh path updated the in-memory access token but never dispatched the new user
    // payload into Redux, so permission-gated UI (e.g. the sidebar) never picked up the new grant.
    await waitFor(() => {
      expect(store.getState().auth.user?.permissions).toEqual(['expensetype.view']);
    });
    expect(meCallCount).toBe(2);
  });

  it('clears the persisted tenantId when a mid-session refresh is rejected (expired/revoked cookie)', async () => {
    // Reproduces the reported "RefreshToken must not be empty" 400: without clearing this, a stale
    // tenantId survives past this session's actual end, and the *next* reload's useSessionBootstrap
    // would read it and call /auth/refresh with no valid cookie attached.
    persistTenantId(staleUser.tenantId);
    setAccessToken('stale-access-token');

    server.use(
      http.get(`${API_BASE}/api/v1/auth/me`, () =>
        HttpResponse.json({ title: 'Unauthorized', status: 401, detail: 'Access token expired.' }, { status: 401 }),
      ),
      http.post(`${API_BASE}/api/v1/auth/refresh`, () =>
        HttpResponse.json({ title: 'Forbidden', status: 403, detail: 'Invalid or expired refresh token.' }, { status: 403 }),
      ),
    );

    const { store } = renderWithProviders(<Harness />, {
      auth: { user: staleUser, isInitialized: true },
    });

    await waitFor(() => {
      expect(store.getState().auth.user).toBeNull();
    });
    expect(readPersistedTenantId()).toBeNull();
  });

  it('coalesces concurrent 401s into a single /auth/refresh call', async () => {
    setAccessToken('stale-access-token');

    let refreshCallCount = 0;
    server.use(
      http.get(`${API_BASE}/api/v1/auth/me`, () =>
        HttpResponse.json({ title: 'Unauthorized', status: 401, detail: 'Access token expired.' }, { status: 401 }),
      ),
      http.post(`${API_BASE}/api/v1/auth/refresh`, () => {
        refreshCallCount += 1;
        return HttpResponse.json({
          accessToken: 'fresh-access-token',
          accessTokenExpiresAtUtc: new Date().toISOString(),
          user: refreshedUserDto,
        });
      }),
    );

    function ConcurrentHarness() {
      useMyProfile();
      useMyProfile();
      return null;
    }

    renderWithProviders(<ConcurrentHarness />, {
      auth: { user: staleUser, isInitialized: true },
    });

    await waitFor(() => {
      expect(refreshCallCount).toBeGreaterThan(0);
    });
    // A brief settle so a second, un-coalesced refresh call (the bug) would have had time to fire.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(refreshCallCount).toBe(1);
  });
});
