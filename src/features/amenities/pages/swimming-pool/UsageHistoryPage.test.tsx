import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { UsageHistoryPage } from './UsageHistoryPage';

const API_BASE = 'https://localhost:7219';

const managerUser: AuthUser = {
  id: 'user-1',
  email: 'manager@example.com',
  name: 'Manager',
  tenantId: 'tenant-1',
  roles: [],
  permissions: ['pool.view', 'pool.incident.manage'],
  buildingIds: [],
  buildingPermissions: [],
};

function mockPools() {
  server.use(
    http.get(`${API_BASE}/api/v1/facilities`, () =>
      HttpResponse.json({ items: [], page: 1, pageSize: 100, total: 0 }),
    ),
  );
}

function session(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    poolSessionId: 'session-1',
    facilityId: 'pool-1',
    flatId: 'flat-12345678',
    personType: 'Resident',
    ageCategory: 'Adult',
    accompaniedBySessionId: null,
    entryAtUtc: '2026-08-08T10:00:00Z',
    exitAtUtc: '2026-08-08T11:30:00Z',
    guestFeeAmount: null,
    safetyAcknowledgedAtUtc: null,
    checkedInBy: 'user-1',
    checkedOutBy: 'user-1',
    overrideReason: null,
    status: 'CheckedOut',
    ...overrides,
  };
}

describe('UsageHistoryPage', () => {
  it('renders paginated history rows', async () => {
    mockPools();
    server.use(
      http.get(`${API_BASE}/api/v1/swimming-pool/sessions`, () =>
        HttpResponse.json({ items: [session()], page: 1, pageSize: 10, total: 1 }),
      ),
      http.get(`${API_BASE}/api/v1/swimming-pool/incidents`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 10, total: 0 }),
      ),
    );

    renderWithProviders(<UsageHistoryPage />, { auth: { user: managerUser, isInitialized: true } });

    expect(await screen.findByText('Resident')).toBeInTheDocument();
  });

  it('paginates incidents instead of silently truncating beyond the first page', async () => {
    mockPools();
    server.use(
      http.get(`${API_BASE}/api/v1/swimming-pool/sessions`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 10, total: 0 }),
      ),
      http.get(`${API_BASE}/api/v1/swimming-pool/incidents`, () =>
        HttpResponse.json({
          items: [{ poolIncidentId: 'inc-1', facilityId: 'pool-1', poolSessionId: null, occurredAtUtc: '2026-08-01T00:00:00Z', description: 'Slippery deck', severity: 'Minor', actionTaken: null }],
          page: 1,
          pageSize: 10,
          total: 25,
        }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<UsageHistoryPage />, { auth: { user: managerUser, isInitialized: true } });

    await user.click(screen.getByRole('tab', { name: 'Incidents' }));

    expect(await screen.findByText(/showing 1–10 of 25/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
  });

  it('shows an error state with retry when history fails to load', async () => {
    mockPools();
    server.use(
      http.get(`${API_BASE}/api/v1/swimming-pool/sessions`, () =>
        HttpResponse.json({ status: 500, title: 'Server error' }, { status: 500 }),
      ),
    );

    renderWithProviders(<UsageHistoryPage />, { auth: { user: managerUser, isInitialized: true } });

    expect(await screen.findByText(/failed to load usage history/i)).toBeInTheDocument();
  });
});
