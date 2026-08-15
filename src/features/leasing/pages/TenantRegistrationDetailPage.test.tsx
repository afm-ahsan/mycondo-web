import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import { createStore } from '@/store/store';
import { server } from '@/test/server';
import type { AuthUser } from '@/store/slices/authSlice';
import { PageHeaderProvider } from '@/providers/page-header-provider';
import { TenantRegistrationDetailPage } from './TenantRegistrationDetailPage';

const API_BASE = 'https://localhost:7219';

function registration(overrides: Partial<Record<string, unknown>> = {}) {
  return {
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
    status: 'Submitted',
    submittedAtUtc: '2026-08-01T00:00:00Z',
    ownerReviewedAtUtc: null,
    managementVerifiedAtUtc: null,
    activatedAtUtc: null,
    movedOutAtUtc: null,
    moveOutReason: null,
    correctionsRequestedReason: null,
    rejectedReason: null,
    ...overrides,
  };
}

function renderDetailPage(
  user: AuthUser,
  initialRegistration: ReturnType<typeof registration>,
  extraHandlers: Parameters<typeof server.use> = [],
) {
  server.use(
    // MSW matches the FIRST handler in registration order — extraHandlers must come first so a
    // test-specific override wins over these generic defaults.
    ...extraHandlers,
    http.get(`${API_BASE}/api/v1/occupancy-registrations/reg-1`, () => HttpResponse.json(initialRegistration)),
    http.get(`${API_BASE}/api/v1/occupancy-registrations/reg-1/household-members`, () => HttpResponse.json([])),
    http.get(`${API_BASE}/api/v1/occupancy-registrations/reg-1/status-history`, () => HttpResponse.json([])),
    http.get(`${API_BASE}/api/v1/occupancy-registrations/reg-1/worker-assignments`, () => HttpResponse.json([])),
    http.get(`${API_BASE}/api/v1/occupancy-registrations/reg-1/vehicle-assignments`, () => HttpResponse.json([])),
  );

  const store = createStore({ auth: { user, isInitialized: true } });
  return render(
    <MemoryRouter initialEntries={['/leasing/tenant-registrations/reg-1']}>
      <Provider store={store}>
        <PageHeaderProvider>
          <Routes>
            <Route path="/leasing/tenant-registrations/:id" element={<TenantRegistrationDetailPage />} />
          </Routes>
        </PageHeaderProvider>
      </Provider>
    </MemoryRouter>,
  );
}

const ownerUser: AuthUser = {
  id: 'user-1',
  email: 'owner@example.com',
  name: 'Flat Owner',
  tenantId: 'tenant-1',
  roles: ['Owner'],
  permissions: ['occupancy-registration.view', 'occupancy-registration.owner-review', 'occupancy-registration.create'],
  buildingIds: [],
  buildingPermissions: [],
};

const viewOnlyUser: AuthUser = { ...ownerUser, permissions: ['occupancy-registration.view'] };

describe('TenantRegistrationDetailPage', () => {
  it('approves a submitted registration', async () => {
    let approveCalled = false;
    renderDetailPage(ownerUser, registration({ status: 'Submitted' }));
    server.use(
      http.post(`${API_BASE}/api/v1/occupancy-registrations/reg-1/owner-approve`, () => {
        approveCalled = true;
        return HttpResponse.json(registration({ status: 'OwnerApproved' }));
      }),
    );

    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Karim Ahmed' });
    await user.click(screen.getByRole('button', { name: /approve/i }));

    await waitFor(() => expect(approveCalled).toBe(true));
  });

  it('rejects a submitted registration with a reason', async () => {
    let receivedBody: unknown = null;
    renderDetailPage(ownerUser, registration({ status: 'Submitted' }));
    server.use(
      http.post(`${API_BASE}/api/v1/occupancy-registrations/reg-1/owner-reject`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json(registration({ status: 'Rejected', rejectedReason: 'Duplicate application' }));
      }),
    );

    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Karim Ahmed' });
    await user.click(screen.getByRole('button', { name: /^reject$/i }));
    await user.type(screen.getByLabelText('Reason'), 'Duplicate application');
    await user.click(screen.getByRole('button', { name: 'Reject', hidden: false }));

    await waitFor(() => expect(receivedBody).toMatchObject({ reason: 'Duplicate application' }));
  });

  it('hides every review action for a view-only user', async () => {
    renderDetailPage(viewOnlyUser, registration({ status: 'Submitted' }));

    await screen.findByRole('heading', { name: 'Karim Ahmed' });
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument();
  });

  it('shows an assigned worker and can end the assignment', async () => {
    let endCalled = false;
    renderDetailPage(ownerUser, registration({ status: 'Active' }), [
      http.get(`${API_BASE}/api/v1/occupancy-registrations/reg-1/worker-assignments`, () =>
        HttpResponse.json([
          {
            occupancyRegistrationWorkerAssignmentId: 'assign-1',
            occupancyRegistrationId: 'reg-1',
            domesticWorkerProfileId: 'worker-1',
            workerFullName: 'Abdul Karim',
            workerPhone: '01799999999',
            workerType: 'Driver',
            verificationStatus: 'Verified',
            assignedAtUtc: '2026-08-01T00:00:00Z',
            endedAtUtc: null,
            isActive: true,
          },
        ]),
      ),
      http.post(`${API_BASE}/api/v1/worker-assignments/assign-1/end`, () => {
        endCalled = true;
        return HttpResponse.json({});
      }),
    ]);

    const user = userEvent.setup();
    const removeButton = await screen.findByRole('button', { name: 'Remove Abdul Karim' });
    expect(screen.getByText('Driver')).toBeInTheDocument();

    await user.click(removeButton);

    await waitFor(() => expect(endCalled).toBe(true));
  });
});
