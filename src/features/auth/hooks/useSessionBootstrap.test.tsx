import { HttpResponse, http } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { useAppSelector } from '@/store/hooks';
import { getAccessToken, setAccessToken } from '@/api/baseApi';
import { useSessionBootstrap } from './useSessionBootstrap';
import { persistTenantId } from '../lib/tenantSession';

const API_BASE = 'https://localhost:7219';
const TENANT_ID = 'tenant-1';

const authUserDto = {
  userId: 'user-1',
  tenantId: TENANT_ID,
  email: 'resident@example.com',
  fullName: 'Resident User',
  roles: ['Resident'],
  permissions: [],
  buildingIds: [],
  buildingPermissions: [],
};

// Mirrors RequireAuth's own gating (src/lib/auth/RequireAuth.tsx) without exercising react-router
// navigation — that's not what this bug is about, and rendering an un-routed <Navigate> here loops
// forever with no <Route> boundary to land on.
function Harness() {
  useSessionBootstrap();
  const { user, isInitialized } = useAppSelector((s) => s.auth);
  if (!isInitialized) {
    return null;
  }
  return user ? <span>Protected content</span> : <span>Redirected to login</span>;
}

// Simulates a page reload: wipes the in-memory access token (a module-level variable — reset by a
// real reload, not by anything React-managed) while leaving sessionStorage/cookies untouched.
function simulateReload() {
  setAccessToken(null);
}

afterEach(() => {
  sessionStorage.clear();
  setAccessToken(null);
});

describe('useSessionBootstrap — reload/bootstrap session restoration', () => {
  it('restores the session after reload when the refresh cookie is still valid (login → reload → authenticated)', async () => {
    persistTenantId(TENANT_ID);
    simulateReload();
    server.use(
      http.post(`${API_BASE}/api/v1/auth/refresh`, () =>
        HttpResponse.json({
          accessToken: 'fresh-access-token',
          accessTokenExpiresAtUtc: new Date().toISOString(),
          user: authUserDto,
        }),
      ),
    );

    const { store } = renderWithProviders(<Harness />);

    await waitFor(() => {
      expect(screen.getByText('Protected content')).toBeInTheDocument();
    });
    expect(store.getState().auth.user?.email).toBe('resident@example.com');
    expect(getAccessToken()).toBe('fresh-access-token');
  });

  it('ends the session when the refresh call is rejected (invalid/expired/revoked cookie → unauthenticated)', async () => {
    persistTenantId(TENANT_ID);
    simulateReload();
    server.use(
      http.post(`${API_BASE}/api/v1/auth/refresh`, () =>
        HttpResponse.json(
          { title: 'Forbidden', status: 403, detail: 'Invalid or expired refresh token.' },
          { status: 403 },
        ),
      ),
    );

    const { store } = renderWithProviders(<Harness />);

    await waitFor(() => {
      expect(store.getState().auth.isInitialized).toBe(true);
    });
    expect(store.getState().auth.user).toBeNull();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('stays unauthenticated without calling refresh when no session was persisted (logout → reload → unauthenticated)', async () => {
    simulateReload();
    let refreshCalled = false;
    server.use(
      http.post(`${API_BASE}/api/v1/auth/refresh`, () => {
        refreshCalled = true;
        return HttpResponse.json(
          { title: 'Forbidden', status: 403, detail: 'Invalid or expired refresh token.' },
          { status: 403 },
        );
      }),
    );

    const { store } = renderWithProviders(<Harness />);

    await waitFor(() => {
      expect(store.getState().auth.isInitialized).toBe(true);
    });
    expect(store.getState().auth.user).toBeNull();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(refreshCalled).toBe(false);
  });
});
