import { HttpResponse, http } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { useAppSelector } from '@/store/hooks';
import { getPlatformAccessToken, setPlatformAccessToken } from '@/api/platformBaseApi';
import { usePlatformSessionBootstrap } from './usePlatformSessionBootstrap';
import { hasPlatformSessionHint, markPlatformSessionActive } from '../lib/platformSession';

const API_BASE = 'https://localhost:7219';

const platformUserDto = {
  platformUserId: 'platform-user-1',
  email: 'sadmin@mycondo.com',
  displayName: 'Platform SuperAdmin',
  roles: ['SuperAdmin'],
  permissions: ['platform.organization.read'],
};

// Mirrors RequireAuth's own gating without exercising react-router navigation.
function Harness() {
  usePlatformSessionBootstrap();
  const { user, isInitialized } = useAppSelector((s) => s.platformAuth);
  if (!isInitialized) {
    return null;
  }
  return user ? <span>Protected content</span> : <span>Redirected to login</span>;
}

// Simulates a page reload: wipes the in-memory access token (a module-level variable — reset by a
// real reload, not by anything React-managed) while leaving sessionStorage/cookies untouched.
function simulateReload() {
  setPlatformAccessToken(null);
}

afterEach(() => {
  sessionStorage.clear();
  setPlatformAccessToken(null);
});

describe('usePlatformSessionBootstrap', () => {
  it('stays unauthenticated without calling refresh on a first/clean visit (no session hint)', async () => {
    simulateReload();
    let refreshCalled = false;
    server.use(
      http.post(`${API_BASE}/api/v1/platform/auth/refresh`, () => {
        refreshCalled = true;
        return HttpResponse.json(
          { title: 'Validation failed', status: 400, errors: { RefreshToken: ["'Refresh Token' must not be empty."] } },
          { status: 400 },
        );
      }),
    );

    const { store } = renderWithProviders(<Harness />);

    await waitFor(() => {
      expect(store.getState().platformAuth.isInitialized).toBe(true);
    });
    expect(store.getState().platformAuth.user).toBeNull();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(refreshCalled).toBe(false);
    expect(hasPlatformSessionHint()).toBe(false);
  });

  it('restores the session after reload when a prior session hint exists and the refresh cookie is still valid', async () => {
    markPlatformSessionActive();
    simulateReload();
    server.use(
      http.post(`${API_BASE}/api/v1/platform/auth/refresh`, () =>
        HttpResponse.json({
          accessToken: 'fresh-platform-access-token',
          accessTokenExpiresAtUtc: new Date().toISOString(),
          user: platformUserDto,
        }),
      ),
    );

    const { store } = renderWithProviders(<Harness />);

    await waitFor(() => {
      expect(screen.getByText('Protected content')).toBeInTheDocument();
    });
    expect(store.getState().platformAuth.user?.email).toBe('sadmin@mycondo.com');
    expect(getPlatformAccessToken()).toBe('fresh-platform-access-token');
  });

  it('ends the session and clears the hint when the refresh call is rejected (expired/revoked cookie)', async () => {
    markPlatformSessionActive();
    simulateReload();
    server.use(
      http.post(`${API_BASE}/api/v1/platform/auth/refresh`, () =>
        HttpResponse.json(
          { title: 'Forbidden', status: 403, detail: 'Invalid or expired refresh token.' },
          { status: 403 },
        ),
      ),
    );

    const { store } = renderWithProviders(<Harness />);

    await waitFor(() => {
      expect(store.getState().platformAuth.isInitialized).toBe(true);
    });
    expect(store.getState().platformAuth.user).toBeNull();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(hasPlatformSessionHint()).toBe(false);
  });
});
