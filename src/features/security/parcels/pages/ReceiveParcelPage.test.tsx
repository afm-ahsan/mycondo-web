import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { ReceiveParcelPage } from './ReceiveParcelPage';

const API_BASE = 'https://localhost:7219';

const guardUser: AuthUser = {
  id: 'user-1',
  email: 'guard@example.com',
  name: 'Gate Guard',
  tenantId: 'tenant-1',
  roles: ['SecurityGuard'],
  permissions: ['parcel.receive'],
  buildingIds: [],
  buildingPermissions: [],
};

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
  );
}

async function chooseOption(user: ReturnType<typeof userEvent.setup>, placeholder: string, optionName: string) {
  const placeholderNode = await screen.findByText(placeholder);
  const trigger = placeholderNode.closest('[role="combobox"]') as HTMLElement;
  await user.click(trigger);
  await user.click(await screen.findByRole('option', { name: optionName }));
}

describe('ReceiveParcelPage', () => {
  it('logs a parcel using the building/flat cascade and navigates to its detail page', async () => {
    mockPropertyLookups();
    let receivedBody: unknown = null;

    server.use(
      http.post(`${API_BASE}/api/v1/parcels`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({
          parcelId: 'parcel-1',
          parcelReference: null,
          courierProvider: null,
          trackingNumber: null,
          senderName: null,
          recipientFlatId: 'flat-1',
          recipientFlatDisplayName: 'A 101',
          recipientResidentId: null,
          parcelType: 'Package',
          packageCount: 1,
          receivedAtUtc: new Date().toISOString(),
          receivedBy: null,
          storageLocation: null,
          notificationStatus: 'NotSent',
          status: 'Received',
          collectedAtUtc: null,
          collectedBy: null,
          collectorName: null,
          collectionAcknowledgement: null,
          damageNote: null,
          closeReason: null,
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ReceiveParcelPage />, { auth: { user: guardUser, isInitialized: true } });

    await chooseOption(user, 'Select a building', 'Tower A (A)');
    await chooseOption(user, 'Select a flat', '101');
    await chooseOption(user, 'Select type', 'Package');
    await user.click(screen.getByRole('button', { name: /log parcel/i }));

    expect(receivedBody).toMatchObject({ recipientFlatId: 'flat-1', parcelType: 'Package', packageCount: 1 });
  }, 15000);

  it('maps a backend validation error onto the matching form field', async () => {
    mockPropertyLookups();

    server.use(
      http.post(`${API_BASE}/api/v1/parcels`, () =>
        HttpResponse.json(
          {
            status: 400,
            title: 'Validation failed',
            errors: { TrackingNumber: ['Tracking number must not exceed 120 characters.'] },
          },
          { status: 400 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<ReceiveParcelPage />, { auth: { user: guardUser, isInitialized: true } });

    await chooseOption(user, 'Select a building', 'Tower A (A)');
    await chooseOption(user, 'Select a flat', '101');
    await chooseOption(user, 'Select type', 'Package');
    await user.click(screen.getByRole('button', { name: /log parcel/i }));

    expect(await screen.findByText('Tracking number must not exceed 120 characters.')).toBeInTheDocument();
  }, 15000);
});
