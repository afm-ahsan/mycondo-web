import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { ReadingRegisterPage } from './ReadingRegisterPage';

const API_BASE = 'https://localhost:7219';

const adminUser: AuthUser = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Utility Admin',
  tenantId: 'tenant-1',
  roles: ['UtilityAdmin'],
  permissions: ['utility.reading.view', 'utility.reading.record'],
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
        items: [{ meterId: 'meter-1', buildingId: 'bld-1', utilityType: 'Electricity', meterNumber: 'ELEC-001', status: 'Active', replacesMeterId: null }],
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
    periodStart: '2026-07-01',
    periodEnd: '2026-07-31',
    previousReading: 100,
    presentReading: 150,
    consumptionUnits: 50,
    readingDate: '2026-08-01',
    status: 'Draft',
    isAbnormalConsumption: false,
    abnormalConsumptionReason: null,
    overrideReason: null,
    invoiceId: null,
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

describe('ReadingRegisterPage', () => {
  it('is meter-scoped: readings only load once a building then a meter are chosen', async () => {
    mockBuildingsAndMeters();
    let receivedMeterId: string | null = null;
    server.use(
      http.get(`${API_BASE}/api/v1/readings`, ({ request }) => {
        receivedMeterId = new URL(request.url).searchParams.get('meterId');
        return HttpResponse.json({ items: [reading()], page: 1, pageSize: 20, total: 1 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ReadingRegisterPage utilityType="Electricity" />, {
      auth: { user: adminUser, isInitialized: true },
    });

    expect(screen.getByText('Select a meter to view its reading register.')).toBeInTheDocument();

    await chooseOption(user, 'Select a building', 'Tower A (A)');
    await chooseOption(user, 'Select a meter', 'ELEC-001 (Active)');

    await waitFor(() => expect(receivedMeterId).toBe('meter-1'));
    expect(await screen.findByText('50')).toBeInTheDocument();
  }, 15000);
});
