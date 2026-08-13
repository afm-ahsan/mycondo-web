import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { FlatOwnerRegistrationWizardPage } from './FlatOwnerRegistrationWizardPage';

const API_BASE = 'https://localhost:7219';

const adminUser: AuthUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin',
  tenantId: 'tenant-1',
  roles: ['SuperAdmin'],
  permissions: ['ownership.manage'],
  buildingIds: [],
  buildingPermissions: [],
};

function setUpMocks() {
  server.use(
    http.get(`${API_BASE}/api/v1/properties/buildings`, () =>
      HttpResponse.json({ items: [{ buildingId: 'b-1', name: 'Tower A', code: 'TA' }], page: 1, pageSize: 100, total: 1 }),
    ),
    http.get(`${API_BASE}/api/v1/properties/buildings/b-1/flats`, () =>
      HttpResponse.json({
        items: [{ flatId: 'flat-1', buildingId: 'b-1', flatNumber: 'A-101', floorNumber: 1, flatType: 'Residential', areaSqFt: null }],
        page: 1,
        pageSize: 100,
        total: 1,
      }),
    ),
    http.get(`${API_BASE}/api/v1/properties/buildings/b-1`, () =>
      HttpResponse.json({ buildingId: 'b-1', name: 'Tower A', code: 'TA', address: null, primaryPhotoAttachmentId: null }),
    ),
    http.get(`${API_BASE}/api/v1/properties/buildings/b-1/flats/flat-1`, () =>
      HttpResponse.json({
        flatId: 'flat-1', buildingId: 'b-1', flatNumber: 'A-101', floorNumber: 1, flatType: 'Residential', areaSqFt: null,
        primaryPhotoAttachmentId: null,
      }),
    ),
    http.post(`${API_BASE}/api/v1/properties/flat-ownerships/register`, () =>
      HttpResponse.json({
        residentId: 'resident-new',
        flatOwnershipId: 'own-new',
        resident: {
          residentId: 'resident-new', flatId: 'flat-1', fullName: 'New Owner', phone: null, email: null,
          residentType: 'Owner', alternatePhone: null, nationalIdNumberMasked: null, passportNumberMasked: null,
          dateOfBirth: null, gender: null, presentAddress: null, permanentAddress: null, fatherName: null,
          motherName: null, maritalStatus: null, profession: null, employer: null, officeAddress: null,
          emergencyContactName: null, emergencyContactPhone: null,
        },
      }),
    ),
    http.get(`${API_BASE}/api/v1/attachments`, () => HttpResponse.json([])),
  );
}

describe('FlatOwnerRegistrationWizardPage', () => {
  it('walks through all steps and registers a new owner', async () => {
    setUpMocks();
    const user = userEvent.setup();
    renderWithProviders(<FlatOwnerRegistrationWizardPage />, { auth: { user: adminUser, isInitialized: true } });

    // Step 1 — Property & Ownership
    await user.click((await screen.findByText('Select a building')).closest('button')!);
    await user.click(await screen.findByRole('option', { name: 'Tower A (TA)' }));
    await user.click((await screen.findByText('Select a flat')).closest('button')!);
    await user.click(await screen.findByRole('option', { name: 'A-101' }));
    await user.click(screen.getByRole('button', { name: /save & continue/i }));

    // Step 2 — Contact & Identity
    await user.type(await screen.findByLabelText('Full name'), 'New Owner');
    await user.click(screen.getByRole('button', { name: /save & continue/i }));

    // Step 3 — Additional Info
    await user.click(await screen.findByRole('button', { name: /save & continue/i }));

    // Step 4 — Review & Submit
    await user.click(await screen.findByRole('button', { name: /register owner/i }));

    // Step 5 — Documents (only reachable once registration succeeded)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /finish/i })).toBeInTheDocument();
    });
  });
});
