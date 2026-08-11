import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor, within } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { ResidentListPage } from './ResidentListPage';

const API_BASE = 'https://localhost:7219';

const adminUser: AuthUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin',
  tenantId: 'tenant-1',
  roles: ['SuperAdmin'],
  permissions: ['resident.view', 'resident.create', 'resident.update', 'resident.disable'],
  buildingIds: [],
  buildingPermissions: [],
};

const viewOnlyUser: AuthUser = { ...adminUser, permissions: ['resident.view'] };

const baseResidents = [
  { residentId: 'res-1', flatId: 'flat-1', fullName: 'Jane Doe', phone: '+8801000000000', email: 'jane@example.com', residentType: 'Owner' },
];

function setUpMocks() {
  server.use(
    http.get(`${API_BASE}/api/v1/residents`, ({ request }) => {
      const url = new URL(request.url);
      const search = url.searchParams.get('search')?.toLowerCase();
      let items = baseResidents;
      if (search) {
        items = items.filter((r) => r.fullName.toLowerCase().includes(search));
      }
      return HttpResponse.json({ items, page: 1, pageSize: 10, total: items.length });
    }),
    http.post(`${API_BASE}/api/v1/residents/:id/disable`, () => new HttpResponse(null, { status: 204 })),
  );
}

describe('ResidentListPage', () => {
  it('renders the resident list', async () => {
    setUpMocks();
    renderWithProviders(<ResidentListPage />, { auth: { user: adminUser, isInitialized: true } });

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Owner')).toBeInTheDocument();
  });

  it('hides the Add Resident action for a user without resident.create', async () => {
    setUpMocks();
    renderWithProviders(<ResidentListPage />, { auth: { user: viewOnlyUser, isInitialized: true } });

    await screen.findByText('Jane Doe');
    expect(screen.queryByRole('button', { name: /add resident/i })).not.toBeInTheDocument();
  });

  it('creates a resident against a selected flat', async () => {
    setUpMocks();
    server.use(
      http.get(`${API_BASE}/api/v1/properties/buildings`, () =>
        HttpResponse.json({ items: [{ buildingId: 'b-1', name: 'Tower A', code: 'TA' }], page: 1, pageSize: 100, totalCount: 1 }),
      ),
      http.get(`${API_BASE}/api/v1/properties/buildings/b-1/flats`, () =>
        HttpResponse.json({ items: [{ flatId: 'flat-2', flatNumber: 'A-202' }], page: 1, pageSize: 100, totalCount: 1 }),
      ),
      http.post(`${API_BASE}/api/v1/residents`, () =>
        HttpResponse.json({ residentId: 'res-2', flatId: 'flat-2', fullName: 'New Person', phone: null, email: null, residentType: 'Occupant' }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<ResidentListPage />, { auth: { user: adminUser, isInitialized: true } });

    await screen.findByText('Jane Doe');
    await user.click(screen.getByRole('button', { name: /add resident/i }));

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByText('Select a building').closest('button')!);
    await user.click(await screen.findByRole('option', { name: 'Tower A (TA)' }));

    await user.click(within(dialog).getByText('Select a flat').closest('button')!);
    await user.click(await screen.findByRole('option', { name: 'A-202' }));

    await user.type(within(dialog).getByLabelText('Full name'), 'New Person');
    await user.click(within(dialog).getByRole('button', { name: /add resident/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
