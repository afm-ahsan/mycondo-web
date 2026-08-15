import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { render, screen, waitFor, within } from '@testing-library/react';
import { createStore } from '@/store/store';
import { server } from '@/test/server';
import type { AuthUser } from '@/store/slices/authSlice';
import { PageHeaderProvider } from '@/providers/page-header-provider';
import { ReadingDetailPage } from './ReadingDetailPage';

const API_BASE = 'https://localhost:7219';

const adminUser: AuthUser = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Utility Admin',
  tenantId: 'tenant-1',
  roles: ['UtilityAdmin'],
  permissions: ['utility.reading.view', 'utility.reading.record', 'utility.reading.finalize', 'utility.reading.correct'],
  buildingIds: [],
  buildingPermissions: [],
};

function reading(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    readingId: 'reading-1',
    meterId: 'meter-1',
    flatId: 'flat-1',
    periodStart: '2026-07-01',
    periodEnd: '2026-07-31',
    previousReading: 100,
    presentReading: 150,
    consumptionUnits: 50,
    readingDate: '2026-08-01',
    status: 'Finalized',
    isAbnormalConsumption: false,
    abnormalConsumptionReason: null,
    overrideReason: null,
    invoiceId: null,
    correctsReadingId: null,
    ...overrides,
  };
}

function renderDetailPage(initialReading: ReturnType<typeof reading>) {
  server.use(http.get(`${API_BASE}/api/v1/readings/reading-1`, () => HttpResponse.json(initialReading)));
  const store = createStore({ auth: { user: adminUser, isInitialized: true } });
  return render(
    <MemoryRouter initialEntries={['/utilities/electricity/readings/reading-1']}>
      <Provider store={store}>
        <PageHeaderProvider>
          <Routes>
            <Route path="/utilities/electricity/readings/:id" element={<ReadingDetailPage utilityType="Electricity" />} />
          </Routes>
        </PageHeaderProvider>
      </Provider>
    </MemoryRouter>,
  );
}

describe('ReadingDetailPage', () => {
  it('bills a Finalized reading with a strong confirmation and an idempotency key', async () => {
    renderDetailPage(reading({ status: 'Finalized' }));

    let receivedKey: string | null = null;
    server.use(
      http.post(`${API_BASE}/api/v1/readings/reading-1/bill`, ({ request }) => {
        receivedKey = request.headers.get('X-Idempotency-Key');
        return HttpResponse.json({ invoiceId: 'inv-9', invoiceNumber: 'INV-U-2026-000009' });
      }),
    );

    const user = userEvent.setup();
    await screen.findByRole('heading', { name: /reading —/i });

    await user.click(screen.getByRole('button', { name: /^bill$/i }));
    expect(screen.getByText(/issues an invoice/i)).toBeInTheDocument();
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: /^bill$/i }));

    await waitFor(() => expect(receivedKey).not.toBeNull());
  }, 15000);

  it('shows the Correct workflow explains a new Draft reading is created, not an in-place edit, for a Billed reading', async () => {
    renderDetailPage(reading({ status: 'Billed', invoiceId: 'inv-1' }));

    const user = userEvent.setup();
    await screen.findByRole('heading', { name: /reading —/i });

    await user.click(screen.getByRole('button', { name: /correct/i }));

    expect(screen.getByText(/correcting it will void the associated invoice/i)).toBeInTheDocument();
    expect(screen.getByText(/does not edit the existing record in place/i)).toBeInTheDocument();
  }, 15000);

  it('does not offer Bill for a reading that is still Draft', async () => {
    renderDetailPage(reading({ status: 'Draft' }));

    await screen.findByRole('heading', { name: /reading —/i });
    expect(screen.queryByRole('button', { name: /^bill$/i })).not.toBeInTheDocument();
  }, 15000);
});
