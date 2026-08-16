import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor, within } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { EntryGateListPage } from './EntryGateListPage';

const API_BASE = 'https://localhost:7219';

const adminUser: AuthUser = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Security Admin',
  tenantId: 'tenant-1',
  roles: ['SuperAdmin'],
  permissions: ['gate.view', 'gate.manage'],
  buildingIds: [],
  buildingPermissions: [],
};

const viewOnlyUser: AuthUser = { ...adminUser, permissions: ['gate.view'] };

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

function gate(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    gateId: 'gate-1',
    buildingId: 'bld-1',
    name: 'Main Gate',
    code: 'MAIN',
    description: null,
    isActive: true,
    isEntryAllowed: true,
    isExitAllowed: true,
    displayOrder: 0,
    ...overrides,
  };
}

async function chooseOption(user: ReturnType<typeof userEvent.setup>, placeholder: string, optionName: string) {
  const placeholderNode = await screen.findByText(placeholder);
  const trigger = placeholderNode.closest('[role="combobox"]') as HTMLElement;
  await user.click(trigger);
  await user.click(await screen.findByRole('option', { name: optionName }));
}

describe('EntryGateListPage', () => {
  it('lists gates for the selected building', async () => {
    mockBuildings();
    server.use(
      http.get(`${API_BASE}/api/v1/properties/buildings/bld-1/gates`, () =>
        HttpResponse.json([gate(), gate({ gateId: 'gate-2', name: 'Service Gate', code: 'SERVICE', isActive: false })]),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<EntryGateListPage />, { auth: { user: adminUser, isInitialized: true } });

    await chooseOption(user, 'Select a building', 'Tower A (A)');

    expect(await screen.findByText('Main Gate')).toBeInTheDocument();
    expect(screen.getByText('Service Gate')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  }, 15000);

  it('hides management actions for a user without gate.manage', async () => {
    mockBuildings();
    server.use(
      http.get(`${API_BASE}/api/v1/properties/buildings/bld-1/gates`, () => HttpResponse.json([gate()])),
    );

    const user = userEvent.setup();
    renderWithProviders(<EntryGateListPage />, { auth: { user: viewOnlyUser, isInitialized: true } });

    await chooseOption(user, 'Select a building', 'Tower A (A)');

    await screen.findByText('Main Gate');
    expect(screen.queryByRole('button', { name: /add gate/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /deactivate/i })).not.toBeInTheDocument();
  }, 15000);

  it('creates a new gate scoped to the selected building', async () => {
    mockBuildings();
    server.use(
      http.get(`${API_BASE}/api/v1/properties/buildings/bld-1/gates`, () => HttpResponse.json([])),
    );

    let receivedBody: unknown = null;
    server.use(
      http.post(`${API_BASE}/api/v1/properties/buildings/bld-1/gates`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json(gate({ gateId: 'gate-new', name: 'North Gate', code: 'NORTH' }));
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<EntryGateListPage />, { auth: { user: adminUser, isInitialized: true } });

    await chooseOption(user, 'Select a building', 'Tower A (A)');
    await user.click(await screen.findByRole('button', { name: /add gate/i }));

    await screen.findByRole('dialog');
    await user.type(screen.getByLabelText('Gate Name'), 'North Gate');
    await user.type(screen.getByLabelText('Code'), 'NORTH');
    await user.click(screen.getByRole('button', { name: /save gate/i }));

    await waitFor(() => {
      expect(receivedBody).toMatchObject({ name: 'North Gate', code: 'NORTH' });
    });
  }, 15000);

  it('deactivates an active gate', async () => {
    mockBuildings();
    let active = true;
    server.use(
      http.get(`${API_BASE}/api/v1/properties/buildings/bld-1/gates`, () =>
        HttpResponse.json([gate({ isActive: active })]),
      ),
      http.post(`${API_BASE}/api/v1/properties/buildings/bld-1/gates/gate-1/deactivate`, () => {
        active = false;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<EntryGateListPage />, { auth: { user: adminUser, isInitialized: true } });

    await chooseOption(user, 'Select a building', 'Tower A (A)');
    const row = (await screen.findByText('Main Gate')).closest('tr')!;
    await user.click(within(row).getByRole('button', { name: /deactivate/i }));

    await waitFor(() => {
      expect(within(row).getByRole('button', { name: /^activate$/i })).toBeInTheDocument();
    });
  }, 15000);
});
