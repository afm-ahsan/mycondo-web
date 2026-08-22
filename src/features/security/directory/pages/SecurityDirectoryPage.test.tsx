import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, within } from '@testing-library/react';
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
  roles: ['SecurityHead'],
  permissions: ['security.directory.view'],
  buildingIds: [],
  buildingPermissions: [],
};

describe('SecurityDirectoryPage', () => {
  it('lists merged Owner and Tenant entries and opens the detail modal with only operational fields', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/security/directory`, () =>
        HttpResponse.json({
          items: [
            {
              entryId: 'reg-1',
              residentType: 'Tenant',
              flatId: 'flat-1',
              flatNumber: 'A-101',
              buildingId: 'building-1',
              buildingName: 'Tower A',
              primaryFullName: 'Karim Ahmed',
              primaryPhotoAttachmentId: null,
              accessStatus: 'Authorized',
              occupancyStatus: 'Active',
            },
            {
              entryId: 'own-1',
              residentType: 'Owner',
              flatId: 'flat-2',
              flatNumber: 'A-102',
              buildingId: 'building-1',
              buildingName: 'Tower A',
              primaryFullName: 'Nasrin Begum',
              primaryPhotoAttachmentId: null,
              accessStatus: 'Authorized',
              occupancyStatus: 'Active',
            },
          ],
          page: 1,
          pageSize: 50,
          total: 2,
        }),
      ),
      http.get(`${API_BASE}/api/v1/security/directory/reg-1`, () =>
        HttpResponse.json({
          entryId: 'reg-1',
          residentType: 'Tenant',
          flatId: 'flat-1',
          flatNumber: 'A-101',
          buildingId: 'building-1',
          buildingName: 'Tower A',
          primaryFullName: 'Karim Ahmed',
          primaryPhone: '+8801700000000',
          primaryPhotoAttachmentId: null,
          accessStatus: 'Authorized',
          occupancyStatus: 'Active',
          householdMembers: [{ fullName: 'Fatima Ahmed', relationshipToPrimary: 'Spouse' }],
          workers: [{ fullName: 'Abdul Karim', workerType: 'Driver', verificationStatus: 'Verified' }],
          vehicles: [{ registrationNumber: 'DHA-GA-1234', vehicleType: 'Car' }],
          extendedDetail: null,
        }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<SecurityDirectoryPage />, { auth: { user: securityUser, isInitialized: true } });

    expect(await screen.findByText('Nasrin Begum')).toBeInTheDocument();
    await user.click(await screen.findByText('Karim Ahmed'));

    expect(await screen.findByText('Fatima Ahmed')).toBeInTheDocument();
    expect(screen.getByText(/Abdul Karim/)).toBeInTheDocument();
    expect(screen.getByText('DHA-GA-1234')).toBeInTheDocument();
    expect(screen.getByText('+8801700000000')).toBeInTheDocument();

    // Structural guarantee, not just an assertion: SecurityDirectoryDetailDto has no NID/address/email
    // fields at all, so there is nothing for this page to accidentally render.
    expect(screen.queryByText(/national id/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/permanent address/i)).not.toBeInTheDocument();
  });

  it('omits a detail section entirely when the caller lacks its granular permission', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/security/directory`, () =>
        HttpResponse.json({
          items: [
            {
              entryId: 'reg-1',
              residentType: 'Tenant',
              flatId: 'flat-1',
              flatNumber: 'A-101',
              buildingId: 'building-1',
              buildingName: 'Tower A',
              primaryFullName: 'Karim Ahmed',
              primaryPhotoAttachmentId: null,
              accessStatus: 'Authorized',
              occupancyStatus: 'Active',
            },
          ],
          page: 1,
          pageSize: 50,
          total: 1,
        }),
      ),
      http.get(`${API_BASE}/api/v1/security/directory/reg-1`, () =>
        HttpResponse.json({
          entryId: 'reg-1',
          residentType: 'Tenant',
          flatId: 'flat-1',
          flatNumber: 'A-101',
          buildingId: 'building-1',
          buildingName: 'Tower A',
          primaryFullName: 'Karim Ahmed',
          primaryPhone: null,
          primaryPhotoAttachmentId: null,
          accessStatus: 'Authorized',
          occupancyStatus: 'Active',
          // A Gatekeeper-only caller holds just security.directory.view — the backend returns null
          // for every granular section rather than an empty list.
          householdMembers: null,
          workers: null,
          vehicles: null,
          extendedDetail: null,
        }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<SecurityDirectoryPage />, { auth: { user: securityUser, isInitialized: true } });

    await user.click(await screen.findByText('Karim Ahmed'));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).queryByText('Household Members')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('Workers & Drivers')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('Vehicles')).not.toBeInTheDocument();
  });

  it('shows an empty state when there are no active residents', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/security/directory`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 50, total: 0 }),
      ),
    );

    renderWithProviders(<SecurityDirectoryPage />, { auth: { user: securityUser, isInitialized: true } });

    expect(await screen.findByText('No residents found')).toBeInTheDocument();
  });
});
