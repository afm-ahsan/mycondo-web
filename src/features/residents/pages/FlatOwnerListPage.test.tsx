import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor, within } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { FlatOwnerListPage } from './FlatOwnerListPage';

const API_BASE = 'https://localhost:7219';

const adminUser: AuthUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin',
  tenantId: 'tenant-1',
  roles: ['SuperAdmin'],
  permissions: ['ownership.manage'],
  buildingIds: [],
  buildingPermissions: [],
};

const viewOnlyUser: AuthUser = { ...adminUser, permissions: [] };

const baseOwners = [
  {
    flatOwnershipId: 'own-1', residentId: 'resident-1', ownerFullName: 'Jane Owner', ownerEmail: 'jane.owner@example.com',
    ownerPhone: '01700000000', flatId: 'flat-1', flatNumber: 'A-101', buildingId: 'b-1', buildingName: 'Tower A',
    status: 'Active', startDate: '2026-01-01', endDate: null,
  },
];

function setUpMocks() {
  server.use(
    http.get(`${API_BASE}/api/v1/properties/flat-ownerships`, () =>
      HttpResponse.json({ items: baseOwners, page: 1, pageSize: 10, total: baseOwners.length }),
    ),
    http.delete(`${API_BASE}/api/v1/properties/flat-ownerships/:id`, () => new HttpResponse(null, { status: 204 })),
    http.get(`${API_BASE}/api/v1/properties/owners/:residentId/ownerships`, () =>
      HttpResponse.json([
        { flatOwnershipId: 'own-1', flatId: 'flat-1', flatNumber: 'A-101', buildingId: 'b-1', buildingName: 'Tower A', status: 'Active', startDate: '2026-01-01', endDate: null },
      ]),
    ),
    http.put(`${API_BASE}/api/v1/properties/flat-ownerships/owners/:residentId/profile`, () =>
      HttpResponse.json({ ...baseOwners[0], residentId: 'resident-1', fullName: 'Jane Owner Updated' }),
    ),
  );
}

describe('FlatOwnerListPage', () => {
  it('renders the ownership register', async () => {
    setUpMocks();
    renderWithProviders(<FlatOwnerListPage />, { auth: { user: adminUser, isInitialized: true } });

    expect(await screen.findByText('Jane Owner')).toBeInTheDocument();
    expect(screen.getByText('A-101 — Tower A')).toBeInTheDocument();
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
  });

  it('hides Add Owner and End ownership for a user without ownership.manage', async () => {
    setUpMocks();
    renderWithProviders(<FlatOwnerListPage />, { auth: { user: viewOnlyUser, isInitialized: true } });

    await screen.findByText('Jane Owner');
    expect(screen.queryByRole('link', { name: /add owner/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /end ownership/i })).not.toBeInTheDocument();
  });

  it('links Add Owner to the registration wizard', async () => {
    setUpMocks();
    renderWithProviders(<FlatOwnerListPage />, { auth: { user: adminUser, isInitialized: true } });

    await screen.findByText('Jane Owner');
    const addOwnerLink = screen.getByRole('link', { name: /add owner/i });
    expect(addOwnerLink).toHaveAttribute('href', '/residents/flat-owners/new');
  });

  it('opens the owner detail dialog showing every flat they own', async () => {
    setUpMocks();
    const user = userEvent.setup();
    renderWithProviders(<FlatOwnerListPage />, { auth: { user: adminUser, isInitialized: true } });

    await screen.findByText('Jane Owner');
    await user.click(screen.getByText('Jane Owner'));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('jane.owner@example.com')).toBeInTheDocument();
    expect(await within(dialog).findByText(/A-101 — Tower A/)).toBeInTheDocument();
  });

  it('edits the owner profile from the detail dialog', async () => {
    setUpMocks();
    const user = userEvent.setup();
    renderWithProviders(<FlatOwnerListPage />, { auth: { user: adminUser, isInitialized: true } });

    await screen.findByText('Jane Owner');
    await user.click(screen.getByText('Jane Owner'));

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /edit profile/i }));
    await user.clear(within(dialog).getByLabelText('Full name'));
    await user.type(within(dialog).getByLabelText('Full name'), 'Jane Owner Updated');
    await user.click(within(dialog).getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(within(dialog).queryByLabelText('Full name')).not.toBeInTheDocument();
    });
  });

  it('ends an active ownership with a confirmation and an end date', async () => {
    setUpMocks();
    const user = userEvent.setup();
    renderWithProviders(<FlatOwnerListPage />, { auth: { user: adminUser, isInitialized: true } });

    await screen.findByText('Jane Owner');
    await user.click(screen.getByRole('button', { name: /end ownership/i }));

    const alert = await screen.findByRole('alertdialog');
    expect(within(alert).getByText(/end this ownership\?/i)).toBeInTheDocument();

    await user.click(within(alert).getByRole('button', { name: /^end ownership$/i }));

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });
});
