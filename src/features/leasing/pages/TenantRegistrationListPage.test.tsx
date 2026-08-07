import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { TenantRegistrationListPage } from './TenantRegistrationListPage';

const API_BASE = 'https://localhost:7219';

const managerUser: AuthUser = {
  id: 'user-1',
  email: 'manager@example.com',
  name: 'Property Manager',
  tenantId: 'tenant-1',
  roles: ['Manager'],
  permissions: ['occupancy-registration.view', 'occupancy-registration.create'],
  buildingIds: [],
  buildingPermissions: [],
};

describe('TenantRegistrationListPage', () => {
  it('shows an empty state and a New Registration action when there are no registrations', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/occupancy-registrations`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 10, total: 0 }),
      ),
    );

    renderWithProviders(<TenantRegistrationListPage />, { auth: { user: managerUser, isInitialized: true } });

    expect(await screen.findByText('No tenant registrations yet.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /new registration/i })).toBeInTheDocument();
  });

  it('renders a registration row with its status', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/occupancy-registrations`, () =>
        HttpResponse.json({
          items: [
            {
              occupancyRegistrationId: 'reg-1',
              flatId: 'flat-1',
              primaryResidentId: 'resident-1',
              occupancyType: 'Occupant',
              primaryFullName: 'Karim Ahmed',
              primaryPhone: null,
              primaryEmail: null,
              primaryNationalIdNumberMasked: null,
              primaryDateOfBirth: null,
              primaryPermanentAddress: null,
              primaryPhotoAttachmentId: null,
              moveInExpectedDate: null,
              status: 'Submitted',
              submittedAtUtc: null,
              ownerReviewedAtUtc: null,
              managementVerifiedAtUtc: null,
              activatedAtUtc: null,
              movedOutAtUtc: null,
              moveOutReason: null,
              correctionsRequestedReason: null,
              rejectedReason: null,
            },
          ],
          page: 1,
          pageSize: 10,
          total: 1,
        }),
      ),
    );

    renderWithProviders(<TenantRegistrationListPage />, { auth: { user: managerUser, isInitialized: true } });

    // Both the desktop table row and the mobile card render in jsdom (CSS breakpoints aren't
    // evaluated) — see TenantRegistrationListPage's responsive-collapse comment.
    expect(await screen.findAllByText('Karim Ahmed')).toHaveLength(2);
    expect(screen.getAllByText('Submitted').length).toBeGreaterThan(0);
  });
});
