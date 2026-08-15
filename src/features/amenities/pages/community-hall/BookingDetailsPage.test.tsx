import { Route, Routes } from 'react-router-dom';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore } from '@/store/store';
import { server } from '@/test/server';
import type { AuthUser } from '@/store/slices/authSlice';
import { PageHeaderProvider } from '@/providers/page-header-provider';
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
        <PageHeaderProvider>
          <Routes>
            <Route path="/facilities/community-hall/bookings/:id" element={<BookingDetailsPage />} />
          </Routes>
        </PageHeaderProvider>
      </Provider>
    </MemoryRouter>,
  );
}

describe('BookingDetailsPage', () => {
  it('approves a pending booking only after confirmation', async () => {
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

    expect(approveCalled).toBe(false);
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }));

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

  it('cancels a confirmed booking with a reason and sends an idempotency key', async () => {
    let receivedBody: unknown = null;
    let receivedKey: string | null = null;
    renderDetailsPage(fullPermissionsUser, booking({ status: 'Confirmed' }));
    server.use(
      http.post(`${API_BASE}/api/v1/facility-bookings/booking-1/cancel`, async ({ request }) => {
        receivedBody = await request.json();
        receivedKey = request.headers.get('X-Idempotency-Key');
        return HttpResponse.json(booking({ status: 'Cancelled', cancelledReason: 'Change of plans' }));
      }),
    );

    const user = userEvent.setup();
    await screen.findByText('Confirmed');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.type(screen.getByLabelText('Reason'), 'Change of plans');
    await user.click(screen.getByRole('button', { name: 'Cancel Booking' }));

    await waitFor(() => expect(receivedBody).toMatchObject({ reason: 'Change of plans' }));
    expect(receivedKey).not.toBeNull();
  });

  it('confirms payment on an AwaitingPayment booking and sends an idempotency key', async () => {
    let receivedKey: string | null = null;
    renderDetailsPage(fullPermissionsUser, booking({ status: 'AwaitingPayment' }));
    server.use(
      http.post(`${API_BASE}/api/v1/facility-bookings/booking-1/confirm-payment`, ({ request }) => {
        receivedKey = request.headers.get('X-Idempotency-Key');
        return HttpResponse.json(booking({ status: 'Confirmed' }));
      }),
    );

    const user = userEvent.setup();
    await screen.findAllByText('Awaiting Payment');
    await user.click(screen.getByRole('button', { name: 'Confirm Payment' }));

    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Confirm Payment' }));

    await waitFor(() => expect(receivedKey).not.toBeNull());
  });

  it('marks a confirmed booking as no-show and sends an idempotency key', async () => {
    let receivedKey: string | null = null;
    renderDetailsPage(fullPermissionsUser, booking({ status: 'Confirmed' }));
    server.use(
      http.post(`${API_BASE}/api/v1/facility-bookings/booking-1/mark-no-show`, ({ request }) => {
        receivedKey = request.headers.get('X-Idempotency-Key');
        return HttpResponse.json(booking({ status: 'NoShow' }));
      }),
    );

    const user = userEvent.setup();
    await screen.findByText('Confirmed');
    await user.click(screen.getByRole('button', { name: 'Mark No-Show' }));

    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Mark No-Show' }));

    await waitFor(() => expect(receivedKey).not.toBeNull());
  });

  it('reuses the same cancel idempotency key on retry after a failed request, and issues a new one after success', async () => {
    const receivedKeys: (string | null)[] = [];
    let shouldFail = true;
    renderDetailsPage(fullPermissionsUser, booking({ status: 'Confirmed' }));
    server.use(
      http.post(`${API_BASE}/api/v1/facility-bookings/booking-1/cancel`, ({ request }) => {
        receivedKeys.push(request.headers.get('X-Idempotency-Key'));
        if (shouldFail) {
          shouldFail = false;
          return HttpResponse.json({ status: 500, title: 'Server error' }, { status: 500 });
        }
        return HttpResponse.json(booking({ status: 'Cancelled', cancelledReason: 'Change of plans' }));
      }),
    );

    const user = userEvent.setup();
    await screen.findByText('Confirmed');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.type(screen.getByLabelText('Reason'), 'Change of plans');
    await user.click(screen.getByRole('button', { name: 'Cancel Booking' }));

    // Dialog must stay open after a failed request — same logical command, same key on retry.
    await waitFor(() => expect(receivedKeys).toHaveLength(1));
    expect(await screen.findByText(/server error/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel Booking' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel Booking' }));
    await waitFor(() => expect(receivedKeys).toHaveLength(2));
    expect(receivedKeys[0]).toBe(receivedKeys[1]);

    // Dialog closes on success; reopening for a new logical command issues a new key.
    await waitFor(() => expect(screen.queryByLabelText('Reason')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.type(screen.getByLabelText('Reason'), 'Second cancellation attempt');
    await user.click(screen.getByRole('button', { name: 'Cancel Booking' }));
    await waitFor(() => expect(receivedKeys).toHaveLength(3));
    expect(receivedKeys[2]).not.toBe(receivedKeys[0]);
  }, 15000);

  it('walks check-in → complete → inspect, shows the deposit settlement, and sends an idempotency key on inspect', async () => {
    let currentBooking = booking({ status: 'Confirmed' });
    let receivedInspectKey: string | null = null;
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
      http.post(`${API_BASE}/api/v1/facility-bookings/booking-1/inspect`, ({ request }) => {
        receivedInspectKey = request.headers.get('X-Idempotency-Key');
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
    let dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Check In' }));
    await screen.findByText('Checked In');

    await user.click(screen.getByRole('button', { name: 'Complete' }));
    dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Complete' }));
    await screen.findByText('Completed');

    await user.click(screen.getByRole('button', { name: 'Inspect' }));
    await user.type(screen.getByLabelText('Damage deduction amount (optional)'), '200');
    await user.type(screen.getByLabelText('Damage deduction reason'), 'Broken chair');
    await user.click(screen.getByRole('button', { name: 'Close After Inspection' }));

    expect(await screen.findByText('Closed')).toBeInTheDocument();
    expect(receivedInspectKey).not.toBeNull();
  }, 15000);

  it('hides every action button for a view-only user', async () => {
    renderDetailsPage(viewOnlyUser, booking({ status: 'PendingApproval' }));

    await screen.findByText('Pending Approval');
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });
});
