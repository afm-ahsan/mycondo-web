import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, within } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { ParcelRegisterPage } from './ParcelRegisterPage';

const API_BASE = 'https://localhost:7219';

const managerUser: AuthUser = {
  id: 'user-1',
  name: 'Front Desk Manager',
  email: 'manager@example.com',
  tenantId: 'tenant-1',
  roles: ['Manager'],
  permissions: ['*'],
  buildingIds: [],
  buildingPermissions: [],
};

function mockParcels() {
  server.use(
    http.get(`${API_BASE}/api/v1/parcels`, () =>
      HttpResponse.json({
        items: [
          {
            parcelId: 'parcel-1',
            parcelReference: 'PKG-001',
            trackingNumber: 'TRK-123',
            courierProvider: 'Pathao Courier',
            senderName: 'Daraz',
            recipientFlatId: 'flat-1',
            recipientFlatDisplayName: 'A A8',
            parcelType: 'Package',
            packageCount: 1,
            receivedAtUtc: '2026-08-08T02:00:00Z',
            status: 'AwaitingCollection',
          },
        ],
        total: 1,
      }),
    ),
  );
}

describe('ParcelRegisterPage', () => {
  it('renders row actions behind a kebab menu instead of a direct View button', async () => {
    const user = userEvent.setup();
    mockParcels();
    renderWithProviders(<ParcelRegisterPage />, { auth: { user: managerUser, isInitialized: true } });

    const row = (await screen.findByText('PKG-001')).closest('tr')!;
    expect(within(row).queryByRole('button', { name: 'View' })).not.toBeInTheDocument();

    const trigger = within(row).getByRole('button', { name: /actions for parcel/i });
    await user.click(trigger);

    const menu = await screen.findByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'View' })).toBeInTheDocument();
  });
});
