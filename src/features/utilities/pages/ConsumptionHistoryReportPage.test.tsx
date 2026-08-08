import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { ConsumptionHistoryReportPage } from './ConsumptionHistoryReportPage';

const API_BASE = 'https://localhost:7219';

const adminUser: AuthUser = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Utility Admin',
  tenantId: 'tenant-1',
  roles: ['UtilityAdmin'],
  permissions: ['utility.reading.view'],
  buildingIds: [],
  buildingPermissions: [],
};

function mockBuildingsAndMeters() {
  server.use(
    http.get(`${API_BASE}/api/v1/properties/buildings`, () =>
      HttpResponse.json({
        items: [{ buildingId: 'bld-1', name: 'Tower A', code: 'A', address: null }],
        page: 1,
        pageSize: 100,
        total: 1,
      }),
    ),
    http.get(`${API_BASE}/api/v1/meters`, () =>
      HttpResponse.json({
        items: [{ meterId: 'meter-1', buildingId: 'bld-1', utilityType: 'Gas', meterNumber: 'GAS-001', status: 'Active', replacesMeterId: null }],
        page: 1,
        pageSize: 100,
        total: 1,
      }),
    ),
  );
}

function reading(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    readingId: 'reading-1',
    meterId: 'meter-1',
    flatId: 'flat-1',
    periodStart: '2026-06-01',
    periodEnd: '2026-06-30',
    previousReading: 100,
    presentReading: 140,
    consumptionUnits: 40,
    readingDate: '2026-07-01',
    status: 'Billed',
    isAbnormalConsumption: false,
    abnormalConsumptionReason: null,
    overrideReason: null,
    invoiceId: 'inv-1',
    correctsReadingId: null,
    ...overrides,
  };
}

async function chooseOption(user: ReturnType<typeof userEvent.setup>, placeholder: string, optionName: string) {
  const placeholderNode = await screen.findByText(placeholder);
  const trigger = placeholderNode.closest('[role="combobox"]') as HTMLElement;
  await user.click(trigger);
  await user.click(await screen.findByRole('option', { name: optionName }));
}

describe('ConsumptionHistoryReportPage', () => {
  it('renders readings in period order using the server-computed consumption figures, flagging abnormal ones', async () => {
    mockBuildingsAndMeters();
    server.use(
      http.get(`${API_BASE}/api/v1/readings`, () =>
        HttpResponse.json({
          items: [
            reading({ readingId: 'reading-2', periodStart: '2026-07-01', periodEnd: '2026-07-31', consumptionUnits: 90, isAbnormalConsumption: true }),
            reading({ readingId: 'reading-1', periodStart: '2026-06-01', periodEnd: '2026-06-30', consumptionUnits: 40 }),
          ],
          page: 1,
          pageSize: 100,
          total: 2,
        }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<ConsumptionHistoryReportPage utilityType="Gas" />, {
      auth: { user: adminUser, isInitialized: true },
    });

    await chooseOption(user, 'Select a building', 'Tower A (A)');
    await chooseOption(user, 'Select a meter', 'GAS-001 (Active)');

    await waitFor(() => expect(screen.getByText('40')).toBeInTheDocument());
    expect(screen.getByText('90')).toBeInTheDocument();
    expect(screen.getByText('Abnormal')).toBeInTheDocument();

    // Earlier period (June) should render before the later one (July) — sorted, not fetch order.
    const periodLabels = screen.getAllByText(/2026-0[67]-01 –/);
    expect(periodLabels[0]).toHaveTextContent('2026-06-01');
    expect(periodLabels[1]).toHaveTextContent('2026-07-01');
  }, 15000);
});
