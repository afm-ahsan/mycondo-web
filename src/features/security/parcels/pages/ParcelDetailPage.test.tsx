import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import { createStore } from '@/store/store';
import { server } from '@/test/server';
import type { AuthUser } from '@/store/slices/authSlice';
import { ParcelDetailPage } from './ParcelDetailPage';

const API_BASE = 'https://localhost:7219';

function parcel(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    parcelId: 'parcel-1',
    parcelReference: 'PKG-001',
    courierProvider: 'Pathao Courier',
    trackingNumber: 'TRK-123',
    senderName: 'Daraz',
    recipientFlatId: 'flat-1',
    recipientResidentId: null,
    parcelType: 'Package',
    packageCount: 1,
    receivedAtUtc: '2026-08-08T02:00:00Z',
    receivedBy: null,
    storageLocation: 'Front desk shelf B',
    notificationStatus: 'NotSent',
    status: 'Received',
    collectedAtUtc: null,
    collectedBy: null,
    collectorName: null,
    collectionAcknowledgement: null,
    damageNote: null,
    closeReason: null,
    ...overrides,
  };
}

function renderDetailPage(user: AuthUser, initialParcel: ReturnType<typeof parcel>) {
  server.use(
    http.get(`${API_BASE}/api/v1/parcels/parcel-1`, () => HttpResponse.json(initialParcel)),
    http.get(`${API_BASE}/api/v1/parcels/parcel-1/custody-history`, () => HttpResponse.json([])),
  );

  const store = createStore({ auth: { user, isInitialized: true } });
  return render(
    <MemoryRouter initialEntries={['/security/parcels/parcel-1']}>
      <Provider store={store}>
        <Routes>
          <Route path="/security/parcels/:id" element={<ParcelDetailPage />} />
        </Routes>
      </Provider>
    </MemoryRouter>,
  );
}

const frontDeskUser: AuthUser = {
  id: 'user-1',
  email: 'frontdesk@example.com',
  name: 'Front Desk',
  tenantId: 'tenant-1',
  roles: ['FrontDesk'],
  permissions: ['parcel.view', 'parcel.handover', 'parcel.return'],
  buildingIds: [],
  buildingPermissions: [],
};

describe('ParcelDetailPage', () => {
  it('records a collection for an awaiting-collection parcel', async () => {
    let collectCalled = false;

    renderDetailPage(frontDeskUser, parcel({ status: 'AwaitingCollection' }));
    server.use(
      http.post(`${API_BASE}/api/v1/parcels/parcel-1/collect`, async ({ request }) => {
        collectCalled = true;
        const body = (await request.json()) as { collectorName: string };
        expect(body.collectorName).toBe('Karim Ahmed');
        return HttpResponse.json(parcel({ status: 'Collected', collectorName: 'Karim Ahmed' }));
      }),
    );

    const user = userEvent.setup();
    expect(await screen.findByRole('heading', { name: 'PKG-001' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /record collection/i }));
    await user.type(screen.getByLabelText('Collected by'), 'Karim Ahmed');
    await user.click(screen.getByRole('button', { name: /confirm collection/i }));

    await waitFor(() => expect(collectCalled).toBe(true));
  }, 15000);

  it('disables the Lost/Escalate close outcome when the user lacks parcel.escalate', async () => {
    renderDetailPage(frontDeskUser, parcel({ status: 'AwaitingCollection' }));

    const user = userEvent.setup();
    expect(await screen.findByRole('heading', { name: 'PKG-001' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^close$/i }));
    const placeholderNode = await screen.findByText('Select outcome');
    const trigger = placeholderNode.closest('[role="combobox"]') as HTMLElement;
    await user.click(trigger);

    const escalateOption = await screen.findByText(/requires parcel\.escalate/i);
    expect(escalateOption.closest('[role="option"]')).toHaveAttribute('aria-disabled', 'true');
  }, 15000);
});
