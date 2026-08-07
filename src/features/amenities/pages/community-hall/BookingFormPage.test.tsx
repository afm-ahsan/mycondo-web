import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { BookingFormPage } from './BookingFormPage';

const API_BASE = 'https://localhost:7219';

const creatorUser: AuthUser = {
  id: 'user-1',
  email: 'staff@example.com',
  name: 'Staff',
  tenantId: 'tenant-1',
  roles: [],
  permissions: ['facility.booking.create'],
  buildingIds: [],
  buildingPermissions: [],
};

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

const resident = { residentId: 'res-1', flatId: 'flat-1', fullName: 'Karim Ahmed', phone: '01711000000', email: null, residentType: 'Owner' };

function mockLookups() {
  server.use(
    http.get(`${API_BASE}/api/v1/facilities`, () => HttpResponse.json({ items: [facility], page: 1, pageSize: 100, total: 1 })),
    http.get(`${API_BASE}/api/v1/facilities/fac-1`, () => HttpResponse.json(facility)),
    http.get(`${API_BASE}/api/v1/residents`, () => HttpResponse.json({ items: [resident], page: 1, pageSize: 20, total: 1 })),
  );
}

async function fillCommonFields(user: ReturnType<typeof userEvent.setup>) {
  const hallTrigger = (await screen.findByText('Select a facility')).closest('[role="combobox"]') as HTMLElement;
  await user.click(hallTrigger);
  await user.click(await screen.findByRole('option', { name: 'Main Hall' }));

  const residentTrigger = screen.getByText('Search by resident name or mobile…').closest('[role="combobox"]') as HTMLElement;
  await user.click(residentTrigger);
  await user.type(screen.getByPlaceholderText('Search by name or mobile…'), 'Karim');
  await user.click(await screen.findByText('Karim Ahmed'));

  await user.type(screen.getByPlaceholderText('e.g. Birthday party'), 'Anniversary dinner');
  await user.type(document.querySelector('input[type="date"]')!, '2026-12-24');
  const timeInputs = document.querySelectorAll('input[type="time"]');
  await user.type(timeInputs[0], '18:00');
  await user.type(timeInputs[1], '22:00');
  await user.click(screen.getByRole('checkbox'));
}

describe('BookingFormPage', () => {
  it('submits a valid booking request and navigates to the new booking', async () => {
    mockLookups();
    let receivedBody: unknown = null;
    server.use(
      http.post(`${API_BASE}/api/v1/facility-bookings`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ bookingId: 'booking-new', status: 'Draft' });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<BookingFormPage />, { auth: { user: creatorUser, isInitialized: true } });

    await fillCommonFields(user);
    await user.click(screen.getByRole('button', { name: /request booking/i }));

    await waitFor(() => expect(receivedBody).not.toBeNull());
    expect(receivedBody).toMatchObject({
      facilityId: 'fac-1',
      flatId: 'flat-1',
      eventType: 'Anniversary dinner',
      termsAccepted: true,
    });
  }, 15000);

  it('surfaces a 409 booking-conflict response as a page-level alert, not a form field error', async () => {
    mockLookups();
    server.use(
      http.post(`${API_BASE}/api/v1/facility-bookings`, () =>
        HttpResponse.json(
          { status: 409, title: 'Conflict', detail: 'Facility fac-1 already has a booking overlapping the requested window.' },
          { status: 409 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<BookingFormPage />, { auth: { user: creatorUser, isInitialized: true } });

    await fillCommonFields(user);
    await user.click(screen.getByRole('button', { name: /request booking/i }));

    expect(await screen.findByText(/already has a booking overlapping/i)).toBeInTheDocument();
  }, 15000);
});
