import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { MeterDirectoryPage } from './MeterDirectoryPage';

const API_BASE = 'https://localhost:7219';

const adminUser: AuthUser = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Utility Admin',
  tenantId: 'tenant-1',
  roles: ['UtilityAdmin'],
  permissions: ['utility.meter.view', 'utility.meter.manage'],
  buildingIds: [],
  buildingPermissions: [],
};

function mockBuildings() {
  server.use(
    http.get(`${API_BASE}/api/v1/properties/buildings`, () =>
      HttpResponse.json({
        items: [{ buildingId: 'bld-1', name: 'Tower A', code: 'A', address: null }],
        page: 1,
        pageSize: 100,
        total: 1,
      }),
    ),
  );
}

function meter(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    meterId: 'meter-1',
    buildingId: 'bld-1',
    utilityType: 'Electricity',
    meterNumber: 'ELEC-001',
    status: 'Active',
    replacesMeterId: null,
    ...overrides,
  };
}

async function chooseOption(user: ReturnType<typeof userEvent.setup>, placeholder: string, optionName: string) {
  const placeholderNode = await screen.findByText(placeholder);
  const trigger = placeholderNode.closest('[role="combobox"]') as HTMLElement;
  await user.click(trigger);
  await user.click(await screen.findByRole('option', { name: optionName }));
}

describe('MeterDirectoryPage', () => {
  it('lists meters for the selected building and scopes requests by utilityType', async () => {
    mockBuildings();
    let receivedUtilityType: string | null = null;
    server.use(
      http.get(`${API_BASE}/api/v1/meters`, ({ request }) => {
        receivedUtilityType = new URL(request.url).searchParams.get('utilityType');
        return HttpResponse.json({ items: [meter()], page: 1, pageSize: 10, total: 1 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<MeterDirectoryPage utilityType="Electricity" />, {
      auth: { user: adminUser, isInitialized: true },
    });

    await chooseOption(user, 'Select a building', 'Tower A (A)');

    expect(await screen.findByText('ELEC-001')).toBeInTheDocument();
    await waitFor(() => expect(receivedUtilityType).toBe('Electricity'));
  }, 15000);

  it('installs a new meter against the selected building and utility type', async () => {
    mockBuildings();
    server.use(
      http.get(`${API_BASE}/api/v1/meters`, () => HttpResponse.json({ items: [], page: 1, pageSize: 10, total: 0 })),
    );

    let receivedBody: unknown = null;
    server.use(
      http.post(`${API_BASE}/api/v1/meters`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json(meter({ meterNumber: 'GAS-009', utilityType: 'Gas' }));
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<MeterDirectoryPage utilityType="Gas" />, {
      auth: { user: adminUser, isInitialized: true },
    });

    await chooseOption(user, 'Select a building', 'Tower A (A)');
    await user.click(await screen.findByRole('button', { name: /install meter/i }));
    await user.type(screen.getByLabelText('Meter number'), 'GAS-009');
    await user.click(screen.getByRole('button', { name: /^install meter$/i }));

    await waitFor(() =>
      expect(receivedBody).toEqual({ buildingId: 'bld-1', utilityType: 'Gas', meterNumber: 'GAS-009' }),
    );
  }, 15000);
});
