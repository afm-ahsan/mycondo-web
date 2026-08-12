import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor, within } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { BuildingListPage } from './BuildingListPage';

const API_BASE = 'https://localhost:7219';

const adminUser: AuthUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin',
  tenantId: 'tenant-1',
  roles: ['SuperAdmin'],
  permissions: ['property.view', 'property.create', 'property.update', 'property.delete'],
  buildingIds: [],
  buildingPermissions: [],
};

const viewOnlyUser: AuthUser = { ...adminUser, permissions: ['property.view'] };

const baseBuildings = [
  { buildingId: 'building-1', name: 'Aisha Tower', code: 'AISHA', address: '123 Gulshan Ave' },
  { buildingId: 'building-2', name: 'Palm Residency', code: 'PALM', address: null },
];

function setUpMocks() {
  server.use(
    http.get(`${API_BASE}/api/v1/properties/buildings`, () =>
      HttpResponse.json({ items: baseBuildings, page: 1, pageSize: 10, total: baseBuildings.length }),
    ),
    http.post(`${API_BASE}/api/v1/properties/buildings`, () =>
      HttpResponse.json({ buildingId: 'building-new', name: 'New Tower', code: 'NEW', address: null }),
    ),
    http.delete(`${API_BASE}/api/v1/properties/buildings/:id`, () => new HttpResponse(null, { status: 204 })),
  );
}

describe('BuildingListPage', () => {
  it('renders the building directory', async () => {
    setUpMocks();
    renderWithProviders(<BuildingListPage />, { auth: { user: adminUser, isInitialized: true } });

    expect(await screen.findByText('Aisha Tower')).toBeInTheDocument();
    expect(screen.getByText('Palm Residency')).toBeInTheDocument();
  });

  it('hides management actions for a user without property.update/delete', async () => {
    setUpMocks();
    renderWithProviders(<BuildingListPage />, { auth: { user: viewOnlyUser, isInitialized: true } });

    await screen.findByText('Aisha Tower');
    expect(screen.queryByRole('button', { name: /add building/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^edit$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /deactivate/i })).not.toBeInTheDocument();
  });

  it('creates a new building', async () => {
    setUpMocks();
    const user = userEvent.setup();
    renderWithProviders(<BuildingListPage />, { auth: { user: adminUser, isInitialized: true } });

    await screen.findByText('Aisha Tower');
    await user.click(screen.getByRole('button', { name: /add building/i }));

    await screen.findByRole('dialog');
    await user.type(screen.getByLabelText('Name'), 'New Tower');
    await user.type(screen.getByLabelText('Code'), 'NEW');
    await user.click(screen.getByRole('button', { name: /create building/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('deactivates a building after confirmation', async () => {
    setUpMocks();
    const user = userEvent.setup();
    renderWithProviders(<BuildingListPage />, { auth: { user: adminUser, isInitialized: true } });

    await screen.findByText('Aisha Tower');
    const row = screen.getByText('Aisha Tower').closest('tr')!;
    await user.click(within(row).getByRole('button', { name: /deactivate/i }));

    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: /^deactivate$/i }));

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });
});
