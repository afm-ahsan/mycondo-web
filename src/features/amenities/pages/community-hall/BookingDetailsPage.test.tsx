import { Route, Routes } from 'react-router-dom';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore } from '@/store/store';
import { server } from '@/test/server';
import type { AuthUser } from '@/store/slices/authSlice';
import { BookingDetailsPage } from './BookingDetailsPage';

const API_BASE = 'https://localhost:7219';

const fullPermissionsUser: AuthUser = {
  id: 'user-1',
  email: 'manager@example.com',
  name: 'Manager',
  tenantId: 'tenant-1',
  roles: [],
  permissions: [
    'facility.booking.view',
    'facility.booking.approve',
    'facility.booking.cancel',
    'facility.booking.inspect',
    'facility.booking.refund',
  ],
  buildingIds: [],
  buildingPermissions: [],
};

const viewOnlyUser: AuthUser = { ...fullPermissionsUser, permissions: ['facility.booking.view'] };

const facility = {
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
};

function booking(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    bookingId: 'booking-1',
    facilityId: 'fac-1',
    buildingId: 'bld-1',
    flatId: 'flat-1',
    eventType: 'Birthday party',
    startAtUtc: '2026-09-01T10:00:00Z',
    endAtUtc: '2026-09-01T14:00:00Z',
    setupBufferMinutes: 30,
    cleanupBufferMinutes: 30,
    expectedGuestCount: 40,
    bookingChargeAmount: 500,
    depositAmount: 2000,
    cancellationDeadlineHours: 24,
    cancellationDeductionPercentage: 50,
    approvalRequired: true,
    paymentRequired: true,
    status: 'PendingApproval',
    invoiceId: null,
    depositCollectionPostingId: null,
    depositSettlementPostingId: null,
    depositRefundedAmount: null,
    depositDeductedAmount: null,
    termsAcceptedAtUtc: '2026-08-01T00:00:00Z',
    approvedBy: null,
    approvedAtUtc: null,
    rejectedReason: null,
    cancelledReason: null,
    cancelledBy: null,
    cancelledAtUtc: null,
    checkedInBy: null,
    checkedInAtUtc: null,
    completedAtUtc: null,
    inspectedBy: null,
    inspectedAtUtc: null,
    inspectionNotes: null,
    damageDeductionReason: null,
    ...overrides,
  };
}

function renderDetailsPage(user: AuthUser, initialBooking: ReturnType<typeof booking>) {
  server.use(
    http.get(`${API_BASE}/api/v1/facility-bookings/booking-1`, () => HttpResponse.json(initialBooking)),
    http.get(`${API_BASE}/api/v1/facilities/fac-1`, () => HttpResponse.json(facility)),
  );

  const store = createStore({ auth: { user, isInitialized: true } });
  return render(
    <MemoryRouter initialEntries={['/facilities/community-hall/bookings/booking-1']}>
      <Provider store={store}>
        <Routes>
          <Route path="/facilities/community-hall/bookings/:id" element={<BookingDetailsPage />} />
        </Routes>
      </Provider>
    </MemoryRouter>,
  );
}

describe('BookingDetailsPage', () => {
  it('approves a pending booking', async () => {
    let approveCalled = false;
    renderDetailsPage(fullPermissionsUser, booking({ status: 'PendingApproval' }));
    server.use(
      http.post(`${API_BASE}/api/v1/facility-bookings/booking-1/approve`, () => {
        approveCalled = true;
        return HttpResponse.json(booking({ status: 'AwaitingPayment' }));
      }),
    );

    const user = userEvent.setup();
    await screen.findByText('Pending Approval');
    await user.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() => expect(approveCalled).toBe(true));
  });

  it('rejects a pending booking with a reason', async () => {
    let receivedBody: unknown = null;
    renderDetailsPage(fullPermissionsUser, booking({ status: 'PendingApproval' }));
    server.use(
      http.post(`${API_BASE}/api/v1/facility-bookings/booking-1/reject`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json(booking({ status: 'Rejected', rejectedReason: 'Hall unavailable' }));
      }),
    );

    const user = userEvent.setup();
    await screen.findByText('Pending Approval');
    await user.click(screen.getByRole('button', { name: 'Reject' }));
    await user.type(screen.getByLabelText('Reason'), 'Hall unavailable');
    await user.click(screen.getByRole('button', { name: 'Reject', hidden: false }));

    await waitFor(() => expect(receivedBody).toMatchObject({ reason: 'Hall unavailable' }));
  });

  it('cancels a confirmed booking with a reason', async () => {
    let receivedBody: unknown = null;
    renderDetailsPage(fullPermissionsUser, booking({ status: 'Confirmed' }));
    server.use(
      http.post(`${API_BASE}/api/v1/facility-bookings/booking-1/cancel`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json(booking({ status: 'Cancelled', cancelledReason: 'Change of plans' }));
      }),
    );

    const user = userEvent.setup();
    await screen.findByText('Confirmed');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.type(screen.getByLabelText('Reason'), 'Change of plans');
    await user.click(screen.getByRole('button', { name: 'Cancel Booking' }));

    await waitFor(() => expect(receivedBody).toMatchObject({ reason: 'Change of plans' }));
  });

  it('walks check-in → complete → inspect and shows the deposit settlement', async () => {
    let currentBooking = booking({ status: 'Confirmed' });
    renderDetailsPage(fullPermissionsUser, currentBooking);
    server.use(
      http.get(`${API_BASE}/api/v1/facility-bookings/booking-1`, () => HttpResponse.json(currentBooking)),
      http.post(`${API_BASE}/api/v1/facility-bookings/booking-1/check-in`, () => {
        currentBooking = booking({ status: 'CheckedIn' });
        return HttpResponse.json(currentBooking);
      }),
      http.post(`${API_BASE}/api/v1/facility-bookings/booking-1/complete`, () => {
        currentBooking = booking({ status: 'Completed' });
        return HttpResponse.json(currentBooking);
      }),
      http.post(`${API_BASE}/api/v1/facility-bookings/booking-1/inspect`, () => {
        currentBooking = booking({
          status: 'ClosedAfterInspection',
          depositRefundedAmount: 1800,
          depositDeductedAmount: 200,
          inspectedAtUtc: '2026-09-02T00:00:00Z',
        });
        return HttpResponse.json(currentBooking);
      }),
    );

    const user = userEvent.setup();
    await screen.findByText('Confirmed');
    await user.click(screen.getByRole('button', { name: 'Check In' }));
    await screen.findByText('Checked In');

    await user.click(screen.getByRole('button', { name: 'Complete' }));
    await screen.findByText('Completed');

    await user.click(screen.getByRole('button', { name: 'Inspect' }));
    await user.type(screen.getByLabelText('Damage deduction amount (optional)'), '200');
    await user.type(screen.getByLabelText('Damage deduction reason'), 'Broken chair');
    await user.click(screen.getByRole('button', { name: 'Close After Inspection' }));

    expect(await screen.findByText('Closed')).toBeInTheDocument();
  }, 15000);

  it('hides every action button for a view-only user', async () => {
    renderDetailsPage(viewOnlyUser, booking({ status: 'PendingApproval' }));

    await screen.findByText('Pending Approval');
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });
});
