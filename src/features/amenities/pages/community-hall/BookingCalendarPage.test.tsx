import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { createStore } from '@/store/store';
import { PageHeaderProvider } from '@/providers/page-header-provider';
import type { AuthUser } from '@/store/slices/authSlice';
import { BookingCalendarPage } from './BookingCalendarPage';

const API_BASE = 'https://localhost:7219';

const viewerUser: AuthUser = {
  id: 'user-1',
  email: 'staff@example.com',
  name: 'Staff',
  tenantId: 'tenant-1',
  roles: [],
  permissions: ['facility.booking.view', 'facility.booking.create'],
  buildingIds: [],
  buildingPermissions: [],
};

function mockFacilities() {
  server.use(
    http.get(`${API_BASE}/api/v1/facilities`, () =>
      HttpResponse.json({
        items: [{ facilityId: 'fac-1', buildingId: 'bld-1', name: 'Main Hall', facilityType: 'CommunityHall', capacity: 100, operatingHoursStart: null, operatingHoursEnd: null, requiresApproval: true, bookingChargeAmount: 500, depositAmount: 2000, cancellationDeadlineHours: 24, cancellationDeductionPercentage: 50, guestFeeAmount: null, minimumAgeUnaccompanied: null, requiresSafetyAcknowledgement: false, blocksEntryIfAccountOverdue: false, isActive: true }],
        page: 1,
        pageSize: 100,
        total: 1,
      }),
    ),
  );
}

// Anchored to "today" (the page defaults to the current month) rather than a hardcoded date, so the
// booking always falls inside the default-rendered grid regardless of when the suite runs.
const midMonth = new Date();
midMonth.setDate(15);
const bookingStartIso = midMonth.toISOString();
const bookingEndIso = new Date(midMonth.getTime() + 4 * 60 * 60 * 1000).toISOString();

function booking(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    bookingId: 'booking-1',
    facilityId: 'fac-1',
    buildingId: 'bld-1',
    flatId: 'flat-1',
    eventType: 'Birthday party',
    startAtUtc: bookingStartIso,
    endAtUtc: bookingEndIso,
    setupBufferMinutes: 30,
    cleanupBufferMinutes: 30,
    expectedGuestCount: 40,
    bookingChargeAmount: 500,
    depositAmount: 2000,
    cancellationDeadlineHours: 24,
    cancellationDeductionPercentage: 50,
    approvalRequired: true,
    paymentRequired: true,
    status: 'Confirmed',
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

describe('BookingCalendarPage', () => {
  it('requests server-side fromDate/toDate matching the visible grid range, not a client-filtered large page', async () => {
    mockFacilities();
    const receivedArgsRef: {
      current: { fromDate: string | null; toDate: string | null; pageSize: string | null } | null;
    } = { current: null };
    server.use(
      http.get(`${API_BASE}/api/v1/facility-bookings`, ({ request }) => {
        const url = new URL(request.url);
        receivedArgsRef.current = {
          fromDate: url.searchParams.get('fromDate'),
          toDate: url.searchParams.get('toDate'),
          pageSize: url.searchParams.get('pageSize'),
        };
        return HttpResponse.json({ items: [booking()], page: 1, pageSize: 100, total: 1 });
      }),
      http.get(`${API_BASE}/api/v1/facilities/fac-1/blackout-dates`, () => HttpResponse.json([])),
    );

    renderWithProviders(<BookingCalendarPage />, { auth: { user: viewerUser, isInitialized: true } });

    await waitFor(() => expect(receivedArgsRef.current).not.toBeNull());
    // A real date range is sent (both bounds present) — the calendar no longer relies on fetching
    // an arbitrary large page and filtering client-side.
    expect(receivedArgsRef.current?.fromDate).toBeTruthy();
    expect(receivedArgsRef.current?.toDate).toBeTruthy();
    expect(new Date(receivedArgsRef.current!.toDate!).getTime()).toBeGreaterThan(
      new Date(receivedArgsRef.current!.fromDate!).getTime(),
    );

    // The booking is discoverable in both the (CSS-hidden-on-desktop) agenda list and the grid —
    // both consume the same single fetch, proving no separate fetching/business logic per breakpoint.
    expect(await screen.findAllByText(/Birthday party/)).not.toHaveLength(0);
  });

  it('shows an error state with retry when the month fails to load', async () => {
    mockFacilities();
    server.use(
      http.get(`${API_BASE}/api/v1/facility-bookings`, () =>
        HttpResponse.json({ status: 500, title: 'Server error' }, { status: 500 }),
      ),
    );

    renderWithProviders(<BookingCalendarPage />, { auth: { user: viewerUser, isInitialized: true } });

    expect(await screen.findByText(/failed to load bookings/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('navigates "+ New Booking" to the real /facilities/community-hall/bookings/new route, not an error page', async () => {
    mockFacilities();
    server.use(
      http.get(`${API_BASE}/api/v1/facility-bookings`, () => HttpResponse.json({ items: [], page: 1, pageSize: 100, total: 0 })),
      http.get(`${API_BASE}/api/v1/facilities/fac-1/blackout-dates`, () => HttpResponse.json([])),
    );

    // Mirrors app-routing-setup.tsx: the calendar route is a single flat leaf path nested under
    // pathless layout <Route> wrappers — the exact shape that made `navigate('../bookings/new')`
    // resolve to "/bookings/new" (routePathnames only has 2 contributing matches, so one ".." pops
    // straight to the app root) instead of "/facilities/community-hall/bookings/new".
    const store = createStore({ auth: { user: viewerUser, isInitialized: true } });
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/facilities/community-hall/calendar']}>
        <Provider store={store}>
          <PageHeaderProvider>
            <Routes>
              <Route element={<Outlet />}>
                <Route element={<Outlet />}>
                  <Route path="/facilities/community-hall/calendar" element={<BookingCalendarPage />} />
                  <Route path="/facilities/community-hall/bookings/new" element={<div>New booking form</div>} />
                </Route>
              </Route>
            </Routes>
          </PageHeaderProvider>
        </Provider>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: /new booking/i }));

    expect(await screen.findByText('New booking form')).toBeInTheDocument();
  });
});
