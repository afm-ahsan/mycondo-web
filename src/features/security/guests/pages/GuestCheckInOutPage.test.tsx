import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { GuestCheckInOutPage } from './GuestCheckInOutPage';

const API_BASE = 'https://localhost:7219';

const guardUser: AuthUser = {
  id: 'user-1',
  email: 'guard@example.com',
  name: 'Gate Guard',
  tenantId: 'tenant-1',
  roles: ['SecurityGuard'],
  permissions: ['visitor.view', 'visitor.create', 'visitor.checkin', 'visitor.checkout'],
  buildingIds: [],
  buildingPermissions: [],
};

const guest = {
  guestProfileId: 'guest-1',
  fullName: 'Karim Ahmed',
  phone: '01711000000',
  identityDocumentType: null,
  identityDocumentNumberMasked: null,
  isBlocked: false,
  blockReason: null,
};

const blockedGuest = { ...guest, guestProfileId: 'guest-2', isBlocked: true, blockReason: 'Reported by resident' };

function mockPropertyLookups() {
  server.use(
    http.get(`${API_BASE}/api/v1/properties/buildings`, () =>
      HttpResponse.json({
        items: [{ buildingId: 'bld-1', name: 'Tower A', code: 'A', address: null }],
        page: 1,
        pageSize: 100,
        total: 1,
      }),
    ),
    http.get(`${API_BASE}/api/v1/properties/buildings/bld-1/flats`, () =>
      HttpResponse.json({
        items: [{ flatId: 'flat-1', buildingId: 'bld-1', flatNumber: '101', floorNumber: 1, flatType: 'Residential', areaSqFt: null }],
        page: 1,
        pageSize: 200,
        total: 1,
      }),
    ),
    http.get(`${API_BASE}/api/v1/properties/buildings/bld-1/gates`, () =>
      HttpResponse.json([
        {
          gateId: 'gate-1',
          buildingId: 'bld-1',
          name: 'Main Gate',
          code: 'MAIN',
          description: null,
          isActive: true,
          isEntryAllowed: true,
          isExitAllowed: true,
          displayOrder: 0,
        },
      ]),
    ),
  );
}

async function chooseOption(user: ReturnType<typeof userEvent.setup>, placeholder: string, optionName: string) {
  const placeholderNode = await screen.findByText(placeholder);
  const trigger = placeholderNode.closest('[role="combobox"]') as HTMLElement;
  await user.click(trigger);
  await user.click(await screen.findByRole('option', { name: optionName }));
}

describe('GuestCheckInOutPage', () => {
  it('finds a guest by phone and checks them in with the exact command payload', async () => {
    mockPropertyLookups();
    let receivedBody: unknown = null;

    server.use(
      http.get(`${API_BASE}/api/v1/guests/by-phone/01711000000`, () => HttpResponse.json(guest)),
      http.get(`${API_BASE}/api/v1/guests/guest-1/visits`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 5, total: 0 }),
      ),
      http.post(`${API_BASE}/api/v1/access-sessions/guests/checkin`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({
          accessSessionId: 'session-1',
          accessCategory: 'Guest',
          guestProfileId: 'guest-1',
          vehicleId: null,
          hostFlatId: 'flat-1',
          purposeOfVisit: null,
          entryGateId: 'gate-1',
          entryAtUtc: new Date().toISOString(),
          exitGateId: null,
          exitAtUtc: null,
          checkedInBy: null,
          checkedOutBy: null,
          approvalStatus: 'Approved',
          passOrQrNumber: null,
          remarks: null,
          status: 'CheckedIn',
          overrideReason: null,
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<GuestCheckInOutPage />, { auth: { user: guardUser, isInitialized: true } });

    await user.type(screen.getByPlaceholderText('Search by mobile number'), '01711000000');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await screen.findByText('Karim Ahmed');

    await chooseOption(user, 'Select a building', 'Tower A (A)');
    await chooseOption(user, 'Select a flat', '101');
    await chooseOption(user, 'Select a gate', 'Main Gate');

    await user.click(screen.getByRole('button', { name: /check in/i }));

    await waitFor(() => expect(receivedBody).not.toBeNull());
    expect(receivedBody).toMatchObject({
      guestProfileId: 'guest-1',
      hostFlatId: 'flat-1',
      entryGateId: 'gate-1',
    });
  }, 15000); // three sequential Select interactions + MSW round trips exceed the 5s default under load

  it('surfaces the backend rejection when checking in a blocked guest, without swallowing or faking it', async () => {
    mockPropertyLookups();

    server.use(
      http.get(`${API_BASE}/api/v1/guests/by-phone/01799999999`, () => HttpResponse.json(blockedGuest)),
      http.get(`${API_BASE}/api/v1/guests/guest-2/visits`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 5, total: 0 }),
      ),
      http.post(`${API_BASE}/api/v1/access-sessions/guests/checkin`, () =>
        HttpResponse.json(
          { status: 409, title: 'Guest is blocked', detail: 'This guest is blocked and cannot check in.' },
          { status: 409 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<GuestCheckInOutPage />, { auth: { user: guardUser, isInitialized: true } });

    await user.type(screen.getByPlaceholderText('Search by mobile number'), '01799999999');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await screen.findByText('Karim Ahmed');
    expect(screen.getByText(/currently blocked|is blocked/i)).toBeInTheDocument();

    await chooseOption(user, 'Select a building', 'Tower A (A)');
    await chooseOption(user, 'Select a flat', '101');
    await chooseOption(user, 'Select a gate', 'Main Gate');

    await user.click(screen.getByRole('button', { name: /check in/i }));

    expect(await screen.findByText('This guest is blocked and cannot check in.')).toBeInTheDocument();
  }, 15000);

  it('checks out a guest with an open visit', async () => {
    mockPropertyLookups();
    let checkoutCalled = false;

    server.use(
      http.get(`${API_BASE}/api/v1/guests/by-phone/01711000000`, () => HttpResponse.json(guest)),
      http.get(`${API_BASE}/api/v1/guests/guest-1/visits`, () =>
        HttpResponse.json({
          items: [
            {
              accessSessionId: 'session-open',
              accessCategory: 'Guest',
              guestProfileId: 'guest-1',
              vehicleId: null,
              hostFlatId: 'flat-1',
              purposeOfVisit: null,
              entryGateId: 'gate-1',
              entryAtUtc: new Date().toISOString(),
              exitGateId: null,
              exitAtUtc: null,
              checkedInBy: null,
              checkedOutBy: null,
              approvalStatus: 'Approved',
              passOrQrNumber: null,
              remarks: null,
              status: 'CheckedIn',
              overrideReason: null,
            },
          ],
          page: 1,
          pageSize: 5,
          total: 1,
        }),
      ),
      http.post(`${API_BASE}/api/v1/access-sessions/guests/session-open/checkout`, () => {
        checkoutCalled = true;
        return HttpResponse.json({
          accessSessionId: 'session-open',
          accessCategory: 'Guest',
          guestProfileId: 'guest-1',
          vehicleId: null,
          hostFlatId: 'flat-1',
          purposeOfVisit: null,
          entryGateId: 'gate-1',
          entryAtUtc: new Date().toISOString(),
          exitGateId: 'gate-1',
          exitAtUtc: new Date().toISOString(),
          checkedInBy: null,
          checkedOutBy: null,
          approvalStatus: 'Approved',
          passOrQrNumber: null,
          remarks: null,
          status: 'CheckedOut',
          overrideReason: null,
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<GuestCheckInOutPage />, { auth: { user: guardUser, isInitialized: true } });

    await user.type(screen.getByPlaceholderText('Search by mobile number'), '01711000000');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await screen.findByText('Karim Ahmed');
    expect(await screen.findByRole('button', { name: /check out/i })).toBeInTheDocument();

    await chooseOption(user, 'Select a building', 'Tower A (A)');
    await chooseOption(user, 'Select a gate', 'Main Gate');

    await user.click(screen.getByRole('button', { name: /check out/i }));

    await waitFor(() => expect(checkoutCalled).toBe(true));
  }, 15000);
});
