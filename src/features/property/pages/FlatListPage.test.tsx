import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { render, screen, waitFor, within } from '@testing-library/react';
import { createStore } from '@/store/store';
import { server } from '@/test/server';
import type { AuthUser } from '@/store/slices/authSlice';
import { FlatListPage } from './FlatListPage';

const API_BASE = 'https://localhost:7219';
const BUILDING_ID = 'building-1';

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

const baseFlats = [
  { flatId: 'flat-1', buildingId: BUILDING_ID, flatNumber: 'A-101', floorNumber: 1, flatType: 'Residential', areaSqFt: null },
  { flatId: 'flat-2', buildingId: BUILDING_ID, flatNumber: 'A-102', floorNumber: 1, flatType: 'Commercial', areaSqFt: 500 },
];

function setUpMocks() {
  server.use(
    http.get(`${API_BASE}/api/v1/properties/buildings/${BUILDING_ID}`, () =>
      HttpResponse.json({ buildingId: BUILDING_ID, name: 'Aisha Tower', code: 'AISHA', address: null }),
    ),
    http.get(`${API_BASE}/api/v1/properties/buildings/${BUILDING_ID}/flats`, () =>
      HttpResponse.json({ items: baseFlats, page: 1, pageSize: 10, total: baseFlats.length }),
    ),
    http.post(`${API_BASE}/api/v1/properties/buildings/${BUILDING_ID}/flats`, () =>
      HttpResponse.json({ flatId: 'flat-new', buildingId: BUILDING_ID, flatNumber: 'B-201', floorNumber: 2, flatType: 'Residential', areaSqFt: null }),
    ),
    http.delete(`${API_BASE}/api/v1/properties/buildings/${BUILDING_ID}/flats/:flatId`, () => new HttpResponse(null, { status: 204 })),
  );
}

function renderFlatListPage(user: AuthUser) {
  const store = createStore({ auth: { user, isInitialized: true } });
  return render(
    <MemoryRouter initialEntries={[`/admin/buildings/${BUILDING_ID}/flats`]}>
      <Provider store={store}>
        <Routes>
          <Route path="/admin/buildings/:buildingId/flats" element={<FlatListPage />} />
        </Routes>
      </Provider>
    </MemoryRouter>,
  );
}

function renderGlobalFlatsPage(user: AuthUser) {
  const store = createStore({ auth: { user, isInitialized: true } });
  return render(
    <MemoryRouter initialEntries={['/admin/flats']}>
      <Provider store={store}>
        <Routes>
          <Route path="/admin/flats" element={<FlatListPage />} />
        </Routes>
      </Provider>
    </MemoryRouter>,
  );
}

function setUpGlobalMocks() {
  server.use(
    http.get(`${API_BASE}/api/v1/properties/buildings`, () =>
      HttpResponse.json({
        items: [{ buildingId: BUILDING_ID, name: 'Aisha Tower', code: 'AISHA', address: null }],
        page: 1,
        pageSize: 100,
        total: 1,
      }),
    ),
    http.get(`${API_BASE}/api/v1/properties/flats`, () =>
      HttpResponse.json({ items: baseFlats, page: 1, pageSize: 10, total: baseFlats.length }),
    ),
    http.post(`${API_BASE}/api/v1/properties/buildings/${BUILDING_ID}/flats`, () =>
      HttpResponse.json({ flatId: 'flat-new', buildingId: BUILDING_ID, flatNumber: 'B-201', floorNumber: 2, flatType: 'Residential', areaSqFt: null }),
    ),
  );
}

describe('FlatListPage — global Administration directory', () => {
  it('renders flats across all buildings with a Building column', async () => {
    setUpGlobalMocks();
    renderGlobalFlatsPage(adminUser);

    expect(await screen.findByText('A-101')).toBeInTheDocument();
    expect(screen.getAllByText('Aisha Tower').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Flats', level: 1 })).toBeInTheDocument();
  });

  it('requires a building to be picked when creating a flat from the global directory', async () => {
    setUpGlobalMocks();
    const user = userEvent.setup();
    renderGlobalFlatsPage(adminUser);

    await screen.findByText('A-101');
    await user.click(screen.getByRole('button', { name: /add flat/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Building')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Flat number'), 'B-201');
    await user.click(screen.getByRole('button', { name: /create flat/i }));

    expect(await screen.findByText('Select a building.')).toBeInTheDocument();
  });
});

describe('FlatListPage', () => {
  it('renders the flats belonging to the selected building', async () => {
    setUpMocks();
    renderFlatListPage(adminUser);

    expect(await screen.findByText('A-101')).toBeInTheDocument();
    expect(screen.getByText('A-102')).toBeInTheDocument();
    expect(await screen.findByText(/Flats — Aisha Tower/i)).toBeInTheDocument();
  });

  it('hides management actions for a user without property.update/delete', async () => {
    setUpMocks();
    renderFlatListPage(viewOnlyUser);

    await screen.findByText('A-101');
    expect(screen.queryByRole('button', { name: /add flat/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^edit$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /deactivate/i })).not.toBeInTheDocument();
  });

  it('creates a new flat', async () => {
    setUpMocks();
    const user = userEvent.setup();
    renderFlatListPage(adminUser);

    await screen.findByText('A-101');
    await user.click(screen.getByRole('button', { name: /add flat/i }));

    await screen.findByRole('dialog');
    await user.type(screen.getByLabelText('Flat number'), 'B-201');
    await user.click(screen.getByRole('button', { name: /create flat/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('deactivates a flat after confirmation', async () => {
    setUpMocks();
    const user = userEvent.setup();
    renderFlatListPage(adminUser);

    await screen.findByText('A-101');
    const row = screen.getByText('A-101').closest('tr')!;
    await user.click(within(row).getByRole('button', { name: /deactivate/i }));

    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: /^deactivate$/i }));

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });
});
