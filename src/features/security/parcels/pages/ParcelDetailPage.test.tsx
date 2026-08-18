import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import { createStore } from '@/store/store';
import { server } from '@/test/server';
import type { AuthUser } from '@/store/slices/authSlice';
import { PageHeaderProvider } from '@/providers/page-header-provider';
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
    recipientFlatDisplayName: 'A A8',
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

function renderDetailPage(
  user: AuthUser,
  initialParcel: ReturnType<typeof parcel>,
  custodyHistory: Record<string, unknown>[] = [],
) {
  server.use(
    http.get(`${API_BASE}/api/v1/parcels/parcel-1`, () => HttpResponse.json(initialParcel)),
    http.get(`${API_BASE}/api/v1/parcels/parcel-1/custody-history`, () => HttpResponse.json(custodyHistory)),
  );

  const store = createStore({ auth: { user, isInitialized: true } });
  return render(
    <MemoryRouter initialEntries={['/security/parcels/parcel-1']}>
      <Provider store={store}>
        <PageHeaderProvider>
          <Routes>
            <Route path="/security/parcels/:id" element={<ParcelDetailPage />} />
          </Routes>
        </PageHeaderProvider>
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

  it('shows a human-readable recipient flat name and never a raw GUID', async () => {
    renderDetailPage(frontDeskUser, parcel({ recipientFlatDisplayName: 'AISHA A8' }));

    expect(await screen.findByRole('heading', { name: 'PKG-001' })).toBeInTheDocument();
    expect(await screen.findByText('AISHA A8')).toBeInTheDocument();
    expect(screen.queryByText('flat-1')).not.toBeInTheDocument();
  });

  it('shows a humanized custody-history status and the resolved actor name, not a raw id', async () => {
    renderDetailPage(frontDeskUser, parcel(), [
      {
        parcelCustodyEventId: 'event-1',
        parcelId: 'parcel-1',
        toStatus: 'AwaitingCollection',
        occurredAtUtc: '2026-08-18T05:57:00Z',
        performedBy: '019fe966-93ce-79f6-81da-eb07e93ea17f',
        performedByDisplayName: 'Ahsan Uddin',
        notes: 'Resident notified',
      },
    ]);

    expect(await screen.findByRole('heading', { name: 'PKG-001' })).toBeInTheDocument();
    expect(await screen.findByText('Awaiting Collection')).toBeInTheDocument();
    expect(await screen.findByText('By Ahsan Uddin')).toBeInTheDocument();
    expect(screen.queryByText(/019fe966/)).not.toBeInTheDocument();
  });
});
