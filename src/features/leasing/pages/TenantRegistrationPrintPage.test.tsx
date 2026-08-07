import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import { createStore } from '@/store/store';
import { server } from '@/test/server';
import type { AuthUser } from '@/store/slices/authSlice';
import { TenantRegistrationPrintPage } from './TenantRegistrationPrintPage';

const API_BASE = 'https://localhost:7219';

const user: AuthUser = {
  id: 'user-1',
  email: 'manager@example.com',
  name: 'Property Manager',
  tenantId: 'tenant-1',
  roles: ['Manager'],
  permissions: ['occupancy-registration.view'],
  buildingIds: [],
  buildingPermissions: [],
};

describe('TenantRegistrationPrintPage', () => {
  it('renders the printable form with masked National ID and no raw sensitive value', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/occupancy-registrations/reg-1`, () =>
        HttpResponse.json({
          occupancyRegistrationId: 'reg-1',
          flatId: 'flat-1',
          primaryResidentId: 'resident-1',
          occupancyType: 'Occupant',
          primaryFullName: 'Karim Ahmed',
          primaryPhone: '01711000000',
          primaryEmail: null,
          primaryNationalIdNumberMasked: '******7890',
          primaryDateOfBirth: null,
          primaryPermanentAddress: null,
          emergencyContactName: null,
          emergencyContactPhone: null,
          primaryPhotoAttachmentId: null,
          moveInExpectedDate: null,
          status: 'Active',
          submittedAtUtc: '2026-08-01T00:00:00Z',
          ownerReviewedAtUtc: null,
          managementVerifiedAtUtc: null,
          activatedAtUtc: null,
          movedOutAtUtc: null,
          moveOutReason: null,
          correctionsRequestedReason: null,
          rejectedReason: null,
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
          activatedAtUtc: null,
          movedOutAtUtc: null,
          householdMembers: [],
          workers: [],
          vehicles: [],
        }),
      ),
      http.get(`${API_BASE}/api/v1/occupancy-registrations/reg-1/household-members`, () => HttpResponse.json([])),
      http.get(`${API_BASE}/api/v1/occupancy-registrations/reg-1/worker-assignments`, () => HttpResponse.json([])),
      http.get(`${API_BASE}/api/v1/occupancy-registrations/reg-1/vehicle-assignments`, () => HttpResponse.json([])),
    );

    const store = createStore({ auth: { user, isInitialized: true } });
    render(
      <MemoryRouter initialEntries={['/leasing/tenant-registrations/reg-1/print']}>
        <Provider store={store}>
          <Routes>
            <Route path="/leasing/tenant-registrations/:id/print" element={<TenantRegistrationPrintPage />} />
          </Routes>
        </Provider>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Flat Owner / Tenant Registration Form')).toBeInTheDocument();
    expect(screen.getByText(/\*{6}7890/)).toBeInTheDocument();
    expect(screen.queryByText('1234567890')).not.toBeInTheDocument();
    expect(screen.getByText('Tower A · Flat A-101')).toBeInTheDocument();
  });
});
