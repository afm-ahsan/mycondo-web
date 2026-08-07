import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { SecurityDirectoryPage } from './SecurityDirectoryPage';

const API_BASE = 'https://localhost:7219';

const securityUser: AuthUser = {
  id: 'user-1',
  email: 'security@example.com',
  name: 'Security Guard',
  tenantId: 'tenant-1',
  roles: ['SecurityGuard'],
  permissions: ['occupancy-registration.security-view'],
  buildingIds: [],
  buildingPermissions: [],
};

describe('SecurityDirectoryPage', () => {
  it('lists active occupancies and opens the detail sheet with only operational fields', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/occupancy-registrations/security`, () =>
        HttpResponse.json({
          items: [
            {
              occupancyRegistrationId: 'reg-1',
              flatNumber: 'A-101',
              buildingName: 'Tower A',
              primaryFullName: 'Karim Ahmed',
              primaryPhotoAttachmentId: null,
              status: 'Active',
              accessEligible: true,
            },
          ],
          page: 1,
          pageSize: 50,
          total: 1,
        }),
      ),
      http.get(`${API_BASE}/api/v1/occupancy-registrations/security/reg-1`, () =>
        HttpResponse.json({
          occupancyRegistrationId: 'reg-1',
          flatId: 'flat-1',
          flatNumber: 'A-101',
          buildingId: 'building-1',
          buildingName: 'Tower A',
          primaryFullName: 'Karim Ahmed',
          primaryPhotoAttachmentId: null,
          occupancyType: 'Occupant',
          status: 'Active',
          accessEligible: true,
          activatedAtUtc: '2026-08-01T00:00:00Z',
          movedOutAtUtc: null,
          householdMembers: [{ fullName: 'Fatima Ahmed', relationshipToPrimary: 'Spouse' }],
          workers: [{ fullName: 'Abdul Karim', workerType: 'Driver', verificationStatus: 'Verified' }],
          vehicles: [{ registrationNumber: 'DHA-GA-1234', vehicleType: 'Car' }],
        }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<SecurityDirectoryPage />, { auth: { user: securityUser, isInitialized: true } });

    await user.click(await screen.findByText('Karim Ahmed'));

    expect(await screen.findByText('Fatima Ahmed')).toBeInTheDocument();
    expect(screen.getByText(/Abdul Karim/)).toBeInTheDocument();
    expect(screen.getByText('DHA-GA-1234')).toBeInTheDocument();

    // Structural guarantee, not just an assertion: OccupancyRegistrationSecurityViewDto has no
    // NID/address/email fields at all, so there is nothing for this page to accidentally render.
    expect(screen.queryByText(/national id/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/permanent address/i)).not.toBeInTheDocument();
  });

  it('shows an empty state when there are no active occupancies', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/occupancy-registrations/security`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 50, total: 0 }),
      ),
    );

    renderWithProviders(<SecurityDirectoryPage />, { auth: { user: securityUser, isInitialized: true } });

    expect(await screen.findByText('No active occupancies to show.')).toBeInTheDocument();
  });
});
