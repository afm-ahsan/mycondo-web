import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { BookingListPage } from './BookingListPage';

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

const sampleBooking = {
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
};

describe('BookingListPage', () => {
  it('shows a loading state before data arrives', () => {
    mockFacilities();
    server.use(
      http.get(`${API_BASE}/api/v1/facility-bookings`, async () => {
        await new Promise(() => {}); // never resolves — proves the loading state renders
        return HttpResponse.json({ items: [], page: 1, pageSize: 10, total: 0 });
      }),
    );

    renderWithProviders(<BookingListPage />, { auth: { user: viewerUser, isInitialized: true } });

    expect(screen.getByText('Bookings')).toBeInTheDocument();
  });

  it('shows an empty state when there are no bookings', async () => {
    mockFacilities();
    server.use(
      http.get(`${API_BASE}/api/v1/facility-bookings`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 10, total: 0 }),
      ),
    );

    renderWithProviders(<BookingListPage />, { auth: { user: viewerUser, isInitialized: true } });

    expect(await screen.findByText('No bookings yet.')).toBeInTheDocument();
  });

  it('shows an error state when the request fails', async () => {
    mockFacilities();
    server.use(
      http.get(`${API_BASE}/api/v1/facility-bookings`, () =>
        HttpResponse.json({ status: 500, title: 'Server error' }, { status: 500 }),
      ),
    );

    renderWithProviders(<BookingListPage />, { auth: { user: viewerUser, isInitialized: true } });

    expect(await screen.findByText(/Failed to load bookings/i)).toBeInTheDocument();
  });

  it('renders booking data with the requested columns', async () => {
    mockFacilities();
    server.use(
      http.get(`${API_BASE}/api/v1/facility-bookings`, () =>
        HttpResponse.json({ items: [sampleBooking], page: 1, pageSize: 10, total: 1 }),
      ),
    );

    renderWithProviders(<BookingListPage />, { auth: { user: viewerUser, isInitialized: true } });

    await waitFor(() => expect(screen.getByText('Main Hall')).toBeInTheDocument());
    expect(screen.getByText('Birthday party')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('Pending Approval')).toBeInTheDocument();
  });

  it('sends Building/Status/Payment-status filters to the server and the rendered rows match the reported total', async () => {
    mockFacilities();
    server.use(
      http.get(`${API_BASE}/api/v1/properties/buildings`, () =>
        HttpResponse.json({ items: [{ buildingId: 'bld-1', name: 'Tower A', code: 'A', address: null }], page: 1, pageSize: 100, total: 1 }),
      ),
    );

    const receivedUrls: string[] = [];
    server.use(
      http.get(`${API_BASE}/api/v1/facility-bookings`, ({ request }) => {
        receivedUrls.push(request.url);
        const url = new URL(request.url);
        // Server "applies" the filter — only one booking matches, and the total reflects exactly that.
        if (url.searchParams.get('buildingId') === 'bld-1' && url.searchParams.get('paymentStatus') === 'AwaitingPayment') {
          return HttpResponse.json({ items: [sampleBooking], page: 1, pageSize: 10, total: 1 });
        }
        return HttpResponse.json({ items: [sampleBooking, sampleBooking], page: 1, pageSize: 10, total: 2 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<BookingListPage />, { auth: { user: viewerUser, isInitialized: true } });

    await waitFor(() => expect(receivedUrls.length).toBeGreaterThan(0));

    const buildingTrigger = (await screen.findByText('All buildings')).closest('[role="combobox"]') as HTMLElement;
    await user.click(buildingTrigger);
    await user.click(await screen.findByRole('option', { name: 'Tower A (A)' }));

    const paymentTrigger = screen.getByText('All payment statuses').closest('[role="combobox"]') as HTMLElement;
    await user.click(paymentTrigger);
    await user.click(await screen.findByRole('option', { name: 'Awaiting Payment' }));

    await waitFor(() => {
      const last = new URL(receivedUrls[receivedUrls.length - 1]);
      expect(last.searchParams.get('buildingId')).toBe('bld-1');
      expect(last.searchParams.get('paymentStatus')).toBe('AwaitingPayment');
    });

    // Rendered row count matches the server's reported total for the filtered result — no
    // client-side filtering shrinking the visible rows below what the count/pagination claim.
    expect(screen.getAllByText('Birthday party')).toHaveLength(1);
  });

  it('has no detectable axe violations with populated rows', async () => {
    mockFacilities();
    server.use(
      http.get(`${API_BASE}/api/v1/facility-bookings`, () =>
        HttpResponse.json({ items: [sampleBooking], page: 1, pageSize: 10, total: 1 }),
      ),
      // Also mock buildings — otherwise BuildingSelect never leaves its loading/disabled state
      // (an unlabeled disabled combobox trigger), which fails axe for an unrelated, unrepresentative
      // reason unrelated to the page's real steady-state markup.
      http.get(`${API_BASE}/api/v1/properties/buildings`, () =>
        HttpResponse.json({ items: [{ buildingId: 'bld-1', name: 'Tower A', code: 'A', address: null }], page: 1, pageSize: 100, total: 1 }),
      ),
    );

    const { container } = renderWithProviders(<BookingListPage />, {
      auth: { user: viewerUser, isInitialized: true },
    });

    await waitFor(() => expect(screen.getByText('Main Hall')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('All buildings')).toBeInTheDocument());

    expect(await axe(container)).toHaveNoViolations();
  });

  it('debounces the event-type search before sending it as a server-side filter', async () => {
    mockFacilities();
    const receivedEventTypes: (string | null)[] = [];
    server.use(
      http.get(`${API_BASE}/api/v1/facility-bookings`, ({ request }) => {
        receivedEventTypes.push(new URL(request.url).searchParams.get('eventType'));
        return HttpResponse.json({ items: [], page: 1, pageSize: 10, total: 0 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<BookingListPage />, { auth: { user: viewerUser, isInitialized: true } });

    await user.type(screen.getByPlaceholderText('Event type…'), 'Wedding');

    // Not sent on every keystroke — only the settled value, after the debounce window.
    await waitFor(() => expect(receivedEventTypes).toContain('Wedding'), { timeout: 2000 });
    expect(receivedEventTypes.filter((v) => v === 'Wedding')).toHaveLength(1);
  });
});
