import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { VehicleCheckInOutPage } from './VehicleCheckInOutPage';

const API_BASE = 'https://localhost:7219';

const guardUser: AuthUser = {
  id: 'user-1',
  email: 'guard@example.com',
  name: 'Gate Guard',
  tenantId: 'tenant-1',
  roles: ['SecurityGuard'],
  permissions: ['vehicle.view', 'vehicle.checkin', 'vehicle.checkout'],
  buildingIds: [],
  buildingPermissions: [],
};

const vehicle = {
  vehicleId: 'vehicle-1',
  registrationNumber: 'DHAKA-METRO-GA-1234',
  vehicleType: 'Car',
  make: 'Toyota',
  model: 'Corolla',
  color: 'White',
  ownershipCategory: 'Resident',
  flatId: null,
  isBlocked: false,
  blockReason: null,
};

const blockedVehicle = { ...vehicle, vehicleId: 'vehicle-2', registrationNumber: 'DHAKA-METRO-GA-9999', isBlocked: true, blockReason: 'Reported for unauthorized parking' };

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

describe('VehicleCheckInOutPage', () => {
  it('finds a vehicle by registration number and checks it in with the exact command payload', async () => {
    mockPropertyLookups();
    let receivedBody: unknown = null;

    server.use(
      http.get(`${API_BASE}/api/v1/vehicles/by-registration/DHAKA-METRO-GA-1234`, () => HttpResponse.json(vehicle)),
      http.get(`${API_BASE}/api/v1/vehicles/vehicle-1/trips`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 5, total: 0 }),
      ),
      http.post(`${API_BASE}/api/v1/access-sessions/vehicles/checkin`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({
          accessSessionId: 'session-1',
          accessCategory: 'Vehicle',
          guestProfileId: null,
          vehicleId: 'vehicle-1',
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
    renderWithProviders(<VehicleCheckInOutPage />, { auth: { user: guardUser, isInitialized: true } });

    await user.type(screen.getByPlaceholderText('Search by registration number'), 'DHAKA-METRO-GA-1234');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await screen.findByText('DHAKA-METRO-GA-1234');

    await chooseOption(user, 'Select a building', 'Tower A (A)');
    await chooseOption(user, 'Select a flat', '101');
    await chooseOption(user, 'Select a gate', 'Main Gate');

    await user.click(screen.getByRole('button', { name: /check in/i }));

    await waitFor(() => expect(receivedBody).not.toBeNull());
    expect(receivedBody).toMatchObject({
      vehicleId: 'vehicle-1',
      hostFlatId: 'flat-1',
      entryGateId: 'gate-1',
    });
  }, 15000); // three sequential Select interactions + MSW round trips exceed the 5s default under load

  it('surfaces the backend rejection when checking in a blocked vehicle, without swallowing or faking it', async () => {
    mockPropertyLookups();

    server.use(
      http.get(`${API_BASE}/api/v1/vehicles/by-registration/DHAKA-METRO-GA-9999`, () => HttpResponse.json(blockedVehicle)),
      http.get(`${API_BASE}/api/v1/vehicles/vehicle-2/trips`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 5, total: 0 }),
      ),
      http.post(`${API_BASE}/api/v1/access-sessions/vehicles/checkin`, () =>
        HttpResponse.json(
          { status: 403, title: 'Vehicle is blocked', detail: 'Vehicle is blocked (Reported for unauthorized parking); an override reason is required to check in.' },
          { status: 403 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<VehicleCheckInOutPage />, { auth: { user: guardUser, isInitialized: true } });

    await user.type(screen.getByPlaceholderText('Search by registration number'), 'DHAKA-METRO-GA-9999');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await screen.findByText('DHAKA-METRO-GA-9999');
    expect(screen.getByText(/is blocked/i)).toBeInTheDocument();

    await chooseOption(user, 'Select a building', 'Tower A (A)');
    await chooseOption(user, 'Select a flat', '101');
    await chooseOption(user, 'Select a gate', 'Main Gate');

    await user.click(screen.getByRole('button', { name: /check in/i }));

    expect(
      await screen.findByText('Vehicle is blocked (Reported for unauthorized parking); an override reason is required to check in.'),
    ).toBeInTheDocument();
  }, 15000);

  it('checks out a vehicle with an open trip', async () => {
    mockPropertyLookups();
    let checkoutCalled = false;

    server.use(
      http.get(`${API_BASE}/api/v1/vehicles/by-registration/DHAKA-METRO-GA-1234`, () => HttpResponse.json(vehicle)),
      http.get(`${API_BASE}/api/v1/vehicles/vehicle-1/trips`, () =>
        HttpResponse.json({
          items: [
            {
              accessSessionId: 'session-open',
              accessCategory: 'Vehicle',
              guestProfileId: null,
              vehicleId: 'vehicle-1',
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
      http.post(`${API_BASE}/api/v1/access-sessions/vehicles/session-open/checkout`, () => {
        checkoutCalled = true;
        return HttpResponse.json({
          accessSessionId: 'session-open',
          accessCategory: 'Vehicle',
          guestProfileId: null,
          vehicleId: 'vehicle-1',
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
    renderWithProviders(<VehicleCheckInOutPage />, { auth: { user: guardUser, isInitialized: true } });

    await user.type(screen.getByPlaceholderText('Search by registration number'), 'DHAKA-METRO-GA-1234');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await screen.findByText('DHAKA-METRO-GA-1234');
    expect(await screen.findByRole('button', { name: /check out/i })).toBeInTheDocument();

    await chooseOption(user, 'Select a building', 'Tower A (A)');
    await chooseOption(user, 'Select a gate', 'Main Gate');

    await user.click(screen.getByRole('button', { name: /check out/i }));

    await waitFor(() => expect(checkoutCalled).toBe(true));
  }, 15000);
});
