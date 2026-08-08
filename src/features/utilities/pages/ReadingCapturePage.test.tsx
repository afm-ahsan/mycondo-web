import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import { createStore } from '@/store/store';
import { server } from '@/test/server';
import type { AuthUser } from '@/store/slices/authSlice';
import { ReadingCapturePage } from './ReadingCapturePage';

const API_BASE = 'https://localhost:7219';

const adminUser: AuthUser = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Utility Admin',
  tenantId: 'tenant-1',
  roles: ['UtilityAdmin'],
  permissions: ['utility.reading.record'],
  buildingIds: [],
  buildingPermissions: [],
};

function renderCapturePage() {
  const store = createStore({ auth: { user: adminUser, isInitialized: true } });
  return render(
    <MemoryRouter initialEntries={['/utilities/electricity/readings/new?meterId=meter-1']}>
      <Provider store={store}>
        <Routes>
          <Route path="/utilities/electricity/readings/new" element={<ReadingCapturePage utilityType="Electricity" />} />
        </Routes>
      </Provider>
    </MemoryRouter>,
  );
}

describe('ReadingCapturePage', () => {
  it('submits a new reading for the meter carried in via meterId, with no client-side charge preview', async () => {
    let receivedBody: unknown = null;
    server.use(
      http.post(`${API_BASE}/api/v1/readings`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({
          readingId: 'reading-9',
          meterId: 'meter-1',
          flatId: 'flat-1',
          periodStart: '2026-08-01',
          periodEnd: '2026-08-31',
          previousReading: 100,
          presentReading: 180,
          consumptionUnits: 80,
          readingDate: '2026-08-08',
          status: 'Draft',
          isAbnormalConsumption: false,
          abnormalConsumptionReason: null,
          overrideReason: null,
          invoiceId: null,
          correctsReadingId: null,
        });
      }),
    );

    const user = userEvent.setup();
    renderCapturePage();

    // No consumption/charge preview is shown anywhere on this form — only server-computed at Finalize/Bill.
    expect(screen.queryByText(/consumption/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/charge/i)).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText('Previous reading'));
    await user.type(screen.getByLabelText('Previous reading'), '100');
    await user.clear(screen.getByLabelText('Present reading'));
    await user.type(screen.getByLabelText('Present reading'), '180');
    await user.click(screen.getByRole('button', { name: /capture reading/i }));

    await waitFor(() =>
      expect(receivedBody).toMatchObject({ meterId: 'meter-1', previousReading: 100, presentReading: 180 }),
    );
  }, 15000);

  it('reveals the override-reason field only after the backend reports a continuity conflict', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/readings`, () =>
        HttpResponse.json(
          { status: 409, title: 'Continuity conflict', detail: 'Previous reading does not match the meter’s last finalized reading.' },
          { status: 409 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderCapturePage();

    expect(screen.queryByLabelText(/override reason/i)).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText('Previous reading'));
    await user.type(screen.getByLabelText('Previous reading'), '999');
    await user.clear(screen.getByLabelText('Present reading'));
    await user.type(screen.getByLabelText('Present reading'), '1050');
    await user.click(screen.getByRole('button', { name: /capture reading/i }));

    expect(await screen.findByLabelText(/override reason/i)).toBeInTheDocument();
  }, 15000);
});
