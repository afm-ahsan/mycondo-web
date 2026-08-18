import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { CurrentOccupancyPage } from './CurrentOccupancyPage';

const API_BASE = 'https://localhost:7219';

const operatorUser: AuthUser = {
  id: 'user-1',
  email: 'operator@example.com',
  name: 'Operator',
  tenantId: 'tenant-1',
  roles: [],
  permissions: ['pool.view', 'pool.checkout'],
  buildingIds: [],
  buildingPermissions: [],
};

function mockPools() {
  server.use(
    http.get(`${API_BASE}/api/v1/facilities`, () =>
      HttpResponse.json({
        items: [{ facilityId: 'pool-1', buildingId: 'bld-1', name: 'Main Pool', facilityType: 'SwimmingPool', capacity: 50, operatingHoursStart: null, operatingHoursEnd: null, requiresApproval: false, bookingChargeAmount: null, depositAmount: null, cancellationDeadlineHours: 0, cancellationDeductionPercentage: 0, guestFeeAmount: null, minimumAgeUnaccompanied: null, requiresSafetyAcknowledgement: false, blocksEntryIfAccountOverdue: false, isActive: true }],
        page: 1,
        pageSize: 100,
        total: 1,
      }),
    ),
  );
}

function session(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    poolSessionId: 'session-1',
    facilityId: 'pool-1',
    flatId: 'flat-12345678',
    flatDisplayName: 'AISHA A8',
    personType: 'Resident',
    ageCategory: 'Adult',
    accompaniedBySessionId: null,
    entryAtUtc: '2026-08-08T10:00:00Z',
    exitAtUtc: null,
    guestFeeAmount: null,
    safetyAcknowledgedAtUtc: null,
    checkedInBy: 'user-1',
    checkedInByDisplayName: 'Ahsan Uddin',
    checkedOutBy: null,
    checkedOutByDisplayName: null,
    overrideReason: null,
    status: 'CheckedIn',
    ...overrides,
  };
}

describe('CurrentOccupancyPage', () => {
  it('shows an empty state when no one is in the pool', async () => {
    mockPools();
    server.use(
      http.get(`${API_BASE}/api/v1/swimming-pool/sessions`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 100, total: 0 }),
      ),
    );

    renderWithProviders(<CurrentOccupancyPage />, { auth: { user: operatorUser, isInitialized: true } });

    expect(await screen.findByText('No one is currently in the pool')).toBeInTheDocument();
  });

  it('checks a resident out and refreshes the list', async () => {
    mockPools();
    let checkOutCalled = false;
    let stillIn = true;
    server.use(
      http.get(`${API_BASE}/api/v1/swimming-pool/sessions`, () =>
        HttpResponse.json({ items: stillIn ? [session()] : [], page: 1, pageSize: 100, total: stillIn ? 1 : 0 }),
      ),
      http.post(`${API_BASE}/api/v1/swimming-pool/sessions/session-1/check-out`, () => {
        checkOutCalled = true;
        stillIn = false;
        return HttpResponse.json(session({ exitAtUtc: '2026-08-08T11:00:00Z', status: 'CheckedOut' }));
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<CurrentOccupancyPage />, { auth: { user: operatorUser, isInitialized: true } });

    expect(await screen.findByText('AISHA A8')).toBeInTheDocument();
    expect(screen.queryByText(/flat-12345678/)).not.toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'Check Out' }));

    await waitFor(() => expect(checkOutCalled).toBe(true));
  });

  it('re-queries sessions for the selected pool when the pool filter changes', async () => {
    mockPools();
    const receivedFacilityIds: (string | null)[] = [];
    server.use(
      http.get(`${API_BASE}/api/v1/swimming-pool/sessions`, ({ request }) => {
        receivedFacilityIds.push(new URL(request.url).searchParams.get('facilityId'));
        return HttpResponse.json({ items: [], page: 1, pageSize: 100, total: 0 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<CurrentOccupancyPage />, { auth: { user: operatorUser, isInitialized: true } });

    const trigger = (await screen.findByText('All pools')).closest('[role="combobox"]') as HTMLElement;
    await user.click(trigger);
    await user.click(await screen.findByRole('option', { name: 'Main Pool' }));

    await waitFor(() => expect(receivedFacilityIds).toContain('pool-1'));
  });
});
