import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { TenantRegistrationListPage } from './TenantRegistrationListPage';

const API_BASE = 'https://localhost:7219';

const managerUser: AuthUser = {
  id: 'user-1',
  email: 'manager@example.com',
  name: 'Property Manager',
  tenantId: 'tenant-1',
  roles: ['Manager'],
  permissions: ['occupancy-registration.view', 'occupancy-registration.create'],
  buildingIds: [],
  buildingPermissions: [],
};

const baseRegistrations = [
  {
    occupancyRegistrationId: 'reg-1',
    primaryFullName: 'Karim Ahmed',
    primaryEmail: 'karim@example.com',
    primaryPhone: '01700000001',
    flatId: 'flat-1',
    flatNumber: 'A-101',
    buildingId: 'b-1',
    buildingName: 'Tower A',
    occupancyType: 'Occupant',
    status: 'Submitted',
    moveInExpectedDate: '2026-03-01',
  },
  {
    occupancyRegistrationId: 'reg-2',
    primaryFullName: 'Nusrat Jahan',
    primaryEmail: 'nusrat@example.com',
    primaryPhone: '01700000002',
    flatId: 'flat-2',
    flatNumber: 'B-202',
    buildingId: 'b-1',
    buildingName: 'Tower A',
    occupancyType: 'Tenant',
    status: 'Active',
    moveInExpectedDate: null,
  },
];

let lastRequestUrl: URL | undefined;

function setUpMocks(registrations = baseRegistrations) {
  server.use(
    http.get(`${API_BASE}/api/v1/occupancy-registrations`, ({ request }) => {
      const url = new URL(request.url);
      lastRequestUrl = url;
      const search = url.searchParams.get('search')?.toLowerCase();
      const status = url.searchParams.get('status');

      let items = registrations;
      if (search) {
        items = items.filter(
          (r) =>
            r.primaryFullName.toLowerCase().includes(search) ||
            r.primaryEmail?.toLowerCase().includes(search) ||
            r.primaryPhone?.toLowerCase().includes(search) ||
            r.flatNumber.toLowerCase().includes(search),
        );
      }
      if (status) {
        items = items.filter((r) => r.status === status);
      }

      return HttpResponse.json({ items, page: 1, pageSize: 10, total: items.length });
    }),
  );
}

describe('TenantRegistrationListPage', () => {
  it('shows an empty state and a New Registration action when there are no registrations', async () => {
    setUpMocks([]);
    renderWithProviders(<TenantRegistrationListPage />, { auth: { user: managerUser, isInitialized: true } });

    expect(await screen.findByText('No tenant registrations yet.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /new registration/i })).toBeInTheDocument();
  });

  it('renders a registration row with its contact, flat, and status columns', async () => {
    setUpMocks();
    renderWithProviders(<TenantRegistrationListPage />, { auth: { user: managerUser, isInitialized: true } });

    // Both the desktop table row and the mobile card render in jsdom (CSS breakpoints aren't
    // evaluated) — see TenantRegistrationListPage's responsive-collapse comment.
    expect(await screen.findAllByText('Karim Ahmed')).not.toHaveLength(0);
    expect(screen.getAllByText('karim@example.com').length).toBeGreaterThan(0);
    expect(screen.getAllByText('01700000001').length).toBeGreaterThan(0);
    expect(screen.getAllByText('A-101 — Tower A').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Submitted').length).toBeGreaterThan(0);
  });

  it('filters the list by search text and clearing it restores all results', async () => {
    setUpMocks();
    const user = userEvent.setup();
    renderWithProviders(<TenantRegistrationListPage />, { auth: { user: managerUser, isInitialized: true } });

    await screen.findAllByText('Karim Ahmed');
    expect(screen.getAllByText('Nusrat Jahan').length).toBeGreaterThan(0);

    const searchBox = screen.getByPlaceholderText('Search by name, email, phone, or flat…');
    await user.type(searchBox, 'nusrat');

    await waitFor(() => {
      expect(screen.queryByText('Karim Ahmed')).not.toBeInTheDocument();
    });
    expect(screen.getAllByText('Nusrat Jahan').length).toBeGreaterThan(0);

    await user.clear(searchBox);

    await waitFor(() => {
      expect(screen.getAllByText('Karim Ahmed').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('Nusrat Jahan').length).toBeGreaterThan(0);
  });

  it('matches search against email, phone, and flat number, not just the name', async () => {
    setUpMocks();
    const user = userEvent.setup();
    renderWithProviders(<TenantRegistrationListPage />, { auth: { user: managerUser, isInitialized: true } });

    await screen.findAllByText('Karim Ahmed');

    const searchBox = screen.getByPlaceholderText('Search by name, email, phone, or flat…');

    await user.type(searchBox, 'nusrat@example.com');
    await waitFor(() => {
      expect(screen.queryByText('Karim Ahmed')).not.toBeInTheDocument();
    });

    await user.clear(searchBox);
    await user.type(searchBox, '01700000001');
    await waitFor(() => {
      expect(screen.queryByText('Nusrat Jahan')).not.toBeInTheDocument();
    });
    expect(screen.getAllByText('Karim Ahmed').length).toBeGreaterThan(0);

    await user.clear(searchBox);
    await user.type(searchBox, 'B-202');
    await waitFor(() => {
      expect(screen.queryByText('Karim Ahmed')).not.toBeInTheDocument();
    });
    expect(screen.getAllByText('Nusrat Jahan').length).toBeGreaterThan(0);
  });

  it('combines search with the status filter', async () => {
    setUpMocks();
    const user = userEvent.setup();
    renderWithProviders(<TenantRegistrationListPage />, { auth: { user: managerUser, isInitialized: true } });

    await screen.findAllByText('Karim Ahmed');

    const statusTrigger = (await screen.findByText('All statuses')).closest('[role="combobox"]') as HTMLElement;
    await user.click(statusTrigger);
    await user.click(await screen.findByRole('option', { name: 'Active' }));

    await waitFor(() => {
      expect(screen.queryByText('Karim Ahmed')).not.toBeInTheDocument();
    });
    expect(screen.getAllByText('Nusrat Jahan').length).toBeGreaterThan(0);

    const searchBox = screen.getByPlaceholderText('Search by name, email, phone, or flat…');
    await user.type(searchBox, 'karim');

    await waitFor(() => {
      expect(screen.queryByText('Nusrat Jahan')).not.toBeInTheDocument();
    });
    expect(screen.queryByText('Karim Ahmed')).not.toBeInTheDocument();
    expect(await screen.findByText('No tenant registrations yet.')).toBeInTheDocument();
  });

  it('resets to page 1 when the search term changes', async () => {
    setUpMocks();
    const user = userEvent.setup();
    renderWithProviders(<TenantRegistrationListPage />, { auth: { user: managerUser, isInitialized: true } });

    await screen.findAllByText('Karim Ahmed');
    expect(lastRequestUrl?.searchParams.get('page')).toBe('1');

    const searchBox = screen.getByPlaceholderText('Search by name, email, phone, or flat…');
    await user.type(searchBox, 'karim');

    await waitFor(() => {
      expect(lastRequestUrl?.searchParams.get('search')).toBe('karim');
    });
    expect(lastRequestUrl?.searchParams.get('page')).toBe('1');
  });
});
