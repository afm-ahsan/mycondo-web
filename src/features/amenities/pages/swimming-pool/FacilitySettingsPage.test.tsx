import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor, within } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { FacilitySettingsPage } from './FacilitySettingsPage';

const API_BASE = 'https://localhost:7219';

const managerUser: AuthUser = {
  id: 'user-1',
  email: 'manager@example.com',
  name: 'Manager',
  tenantId: 'tenant-1',
  roles: [],
  permissions: ['facility.manage'],
  buildingIds: [],
  buildingPermissions: [],
};

function facility(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    facilityId: 'fac-1',
    buildingId: 'bld-1',
    name: 'Main Hall',
    facilityType: 'CommunityHall',
    capacity: 100,
    operatingHoursStart: null,
    operatingHoursEnd: null,
    requiresApproval: true,
    bookingChargeAmount: 500,
    depositAmount: 2000,
    cancellationDeadlineHours: 24,
    cancellationDeductionPercentage: 50,
    guestFeeAmount: null,
    minimumAgeUnaccompanied: null,
    requiresSafetyAcknowledgement: false,
    blocksEntryIfAccountOverdue: false,
    isActive: true,
    ...overrides,
  };
}

describe('FacilitySettingsPage', () => {
  it('shows an empty state when no facilities are configured', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/facilities`, () => HttpResponse.json({ items: [], page: 1, pageSize: 100, total: 0 })),
    );

    renderWithProviders(<FacilitySettingsPage facilityContext="SwimmingPool" />, { auth: { user: managerUser, isInitialized: true } });

    expect(await screen.findByText('No facilities configured yet')).toBeInTheDocument();
  });

  it('deactivates a facility only after confirmation', async () => {
    let deactivateCalled = false;
    server.use(
      http.get(`${API_BASE}/api/v1/facilities`, () => HttpResponse.json({ items: [facility()], page: 1, pageSize: 100, total: 1 })),
      http.post(`${API_BASE}/api/v1/facilities/fac-1/deactivate`, () => {
        deactivateCalled = true;
        return HttpResponse.json(facility({ isActive: false }));
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<FacilitySettingsPage facilityContext="SwimmingPool" />, { auth: { user: managerUser, isInitialized: true } });

    await user.click(await screen.findByRole('button', { name: 'Deactivate' }));
    expect(deactivateCalled).toBe(false);

    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText(/blocks all future bookings/i)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Deactivate' }));

    await waitFor(() => expect(deactivateCalled).toBe(true));
  });

  it('shows a context-appropriate title depending on which menu entry it was reached from', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/facilities`, () => HttpResponse.json({ items: [], page: 1, pageSize: 100, total: 0 })),
    );

    const { unmount } = renderWithProviders(<FacilitySettingsPage facilityContext="CommunityHall" />, {
      auth: { user: managerUser, isInitialized: true },
    });
    expect(await screen.findByRole('heading', { name: 'Halls / Settings' })).toBeInTheDocument();
    unmount();

    renderWithProviders(<FacilitySettingsPage facilityContext="SwimmingPool" />, {
      auth: { user: managerUser, isInitialized: true },
    });
    expect(await screen.findByRole('heading', { name: 'Closures / Settings' })).toBeInTheDocument();
  });
});
