import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { TenantRegistrationWizardPage } from './TenantRegistrationWizardPage';

const API_BASE = 'https://localhost:7219';

const managerUser: AuthUser = {
  id: 'user-1',
  email: 'manager@example.com',
  name: 'Property Manager',
  tenantId: 'tenant-1',
  roles: ['Manager'],
  permissions: ['occupancy-registration.create'],
  buildingIds: [],
  buildingPermissions: [],
};

describe('TenantRegistrationWizardPage', () => {
  it('shows required-field validation on Step 1 without creating a registration', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/properties/buildings`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 100, total: 0 }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<TenantRegistrationWizardPage />, { auth: { user: managerUser, isInitialized: true } });

    await user.click(screen.getByRole('button', { name: /save & continue/i }));

    expect(await screen.findByText('Select a building.')).toBeInTheDocument();
    expect(screen.getByText('Select a flat.')).toBeInTheDocument();
    expect(screen.getByText('Full name is required.')).toBeInTheDocument();
  });

  it('creates a draft registration and advances to Step 2 on valid submission', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/properties/buildings`, () =>
        HttpResponse.json({
          items: [{ buildingId: 'building-1', name: 'Tower A', code: 'A' }],
          page: 1,
          pageSize: 100,
          total: 1,
        }),
      ),
      http.get(`${API_BASE}/api/v1/properties/buildings/:buildingId/flats`, () =>
        HttpResponse.json({
          items: [{ flatId: 'flat-1', buildingId: 'building-1', flatNumber: 'A-101', floorNumber: 1, flatType: 'Residential', areaSqFt: null }],
          page: 1,
          pageSize: 100,
          total: 1,
        }),
      ),
      http.post(`${API_BASE}/api/v1/occupancy-registrations`, () =>
        HttpResponse.json({
          occupancyRegistrationId: 'reg-1',
          flatId: 'flat-1',
          primaryResidentId: 'resident-1',
          occupancyType: 'Owner',
          primaryFullName: 'Karim Ahmed',
          primaryPhone: null,
          primaryEmail: null,
          primaryNationalIdNumberMasked: null,
          primaryDateOfBirth: null,
          primaryPermanentAddress: null,
          primaryPhotoAttachmentId: null,
          moveInExpectedDate: null,
          status: 'Draft',
          submittedAtUtc: null,
          ownerReviewedAtUtc: null,
          managementVerifiedAtUtc: null,
          activatedAtUtc: null,
          movedOutAtUtc: null,
          moveOutReason: null,
          correctionsRequestedReason: null,
          rejectedReason: null,
        }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<TenantRegistrationWizardPage />, { auth: { user: managerUser, isInitialized: true } });

    const comboboxes = await screen.findAllByRole('combobox');
    await user.click(comboboxes[0]);
    await user.click(await screen.findByRole('option', { name: /tower a/i }));

    await user.click(screen.getAllByRole('combobox')[1]);
    await user.click(await screen.findByRole('option', { name: 'A-101' }));

    await user.type(screen.getByLabelText("Primary occupant's full name"), 'Karim Ahmed');
    await user.click(screen.getByRole('button', { name: /save & continue/i }));

    expect(await screen.findByLabelText(/^full name/i)).toBeInTheDocument();
  });
});
