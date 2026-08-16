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
    http.post(`${API_BASE}/api/v1/properties/flat-ownerships/owner-resident-profile`, () =>
      HttpResponse.json({
        residentId: 'resident-new', flatId: 'flat-1', fullName: 'New Owner', phone: null, email: null,
        residentType: 'Owner', alternatePhone: null, nationalIdNumberMasked: '****3210', passportNumberMasked: null,
        dateOfBirth: '1990-01-01', gender: 'Male', presentAddress: null, permanentAddress: null, fatherName: null,
        motherName: null, maritalStatus: null, profession: null, employer: null, officeAddress: null,
        emergencyContactName: null, emergencyContactPhone: null, bloodGroup: null, religion: null, nationality: null,
      }),
    ),
    http.get(`${API_BASE}/api/v1/residents/resident-new/household-members`, () => HttpResponse.json([])),
    http.get(`${API_BASE}/api/v1/attachments`, () => HttpResponse.json([])),
    http.post(`${API_BASE}/api/v1/properties/flat-ownerships`, () =>
      HttpResponse.json({ flatOwnershipId: 'own-new', residentId: 'resident-new', flatId: 'flat-1', startDate: '2026-08-16' }),
    ),
  );
}

describe('FlatOwnerRegistrationWizardPage', () => {
  // This walks all 5 steps with many sequential interactions — under full-suite parallel load that
  // can exceed the default 5s test timeout even though it's reliably fast in isolation.
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

    // Step 2 — Contact & Identity (creates the Resident via SaveOwnerResidentProfile)
    await user.type(await screen.findByLabelText('Full name'), 'New Owner');
    await user.type(screen.getByLabelText('National ID'), '1234567890123');
    await user.type(screen.getByLabelText('Date of birth'), '1990-01-01');
    await user.click((await screen.findByText('Select gender')).closest('button')!);
    await user.click(await screen.findByRole('option', { name: 'Male' }));
    await user.click(screen.getByRole('button', { name: /save & continue/i }));

    // Step 3 — Household (optional, skip)
    await user.click(await screen.findByRole('button', { name: /^continue$/i }));

    // Step 4 — Documents
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^continue$/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /^continue$/i }));

    // Step 5 — Review & Submit. The test harness's MemoryRouter has no <Routes>, so
    // onRegistered's navigate() doesn't unmount this page — success is instead confirmed by the
    // mutation completing without surfacing an error and the button leaving its loading state.
    const registerButton = await screen.findByRole('button', { name: /register owner/i });
    await user.click(registerButton);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /register owner/i })).not.toBeDisabled();
    });
  }, 15000);
});
