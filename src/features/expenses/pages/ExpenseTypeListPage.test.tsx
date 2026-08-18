import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor, within } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { ExpenseTypeListPage } from './ExpenseTypeListPage';

const API_BASE = 'https://localhost:7219';

const adminUser: AuthUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin',
  tenantId: 'tenant-1',
  roles: ['SuperAdmin'],
  permissions: ['expensetype.view', 'expensetype.manage'],
  buildingIds: [],
  buildingPermissions: [],
};

const viewOnlyUser: AuthUser = { ...adminUser, permissions: ['expensetype.view'] };

const baseTypes = [
  { expenseTypeId: 'type-1', name: 'Cleaning', code: 'CLN', description: null, isActive: true, displayOrder: 1 },
  { expenseTypeId: 'type-2', name: 'Security', code: 'SEC', description: null, isActive: false, displayOrder: 2 },
];

function setUpMocks() {
  // `type-1` starts Active; the deactivate handler flips it so the refetch after the mutation
  // reflects the change — proving the UI is wired to the real mutation+refetch flow.
  let type1Active = true;

  server.use(
    http.get(`${API_BASE}/api/v1/expense-types`, () => {
      const items = baseTypes.map((t) => (t.expenseTypeId === 'type-1' ? { ...t, isActive: type1Active } : t));
      return HttpResponse.json({ items, page: 1, pageSize: 10, total: items.length });
    }),
    http.post(`${API_BASE}/api/v1/expense-types`, () =>
      HttpResponse.json({ expenseTypeId: 'type-new', name: 'Generator Fuel', code: 'FUEL', description: null, isActive: true, displayOrder: 3 }),
    ),
    http.post(`${API_BASE}/api/v1/expense-types/:id/deactivate`, () => {
      type1Active = false;
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(`${API_BASE}/api/v1/expense-types/:id/activate`, () => {
      type1Active = true;
      return new HttpResponse(null, { status: 204 });
    }),
  );
}

describe('ExpenseTypeListPage', () => {
  it('renders the expense type catalogue', async () => {
    setUpMocks();
    renderWithProviders(<ExpenseTypeListPage />, { auth: { user: adminUser, isInitialized: true } });

    expect(await screen.findByText('Cleaning')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('hides management actions for a user without expensetype.manage', async () => {
    setUpMocks();
    renderWithProviders(<ExpenseTypeListPage />, { auth: { user: viewOnlyUser, isInitialized: true } });

    await screen.findByText('Cleaning');
    expect(screen.queryByRole('button', { name: /add expense type/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /deactivate/i })).not.toBeInTheDocument();
  });

  it('creates a new expense type', async () => {
    setUpMocks();
    const user = userEvent.setup();
    renderWithProviders(<ExpenseTypeListPage />, { auth: { user: adminUser, isInitialized: true } });

    await screen.findByText('Cleaning');
    await user.click(screen.getByRole('button', { name: /add expense type/i }));

    await screen.findByRole('dialog');
    await user.type(screen.getByLabelText('Name'), 'Generator Fuel');
    await user.type(screen.getByLabelText('Code'), 'FUEL');
    await user.click(screen.getByRole('button', { name: /create expense type/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('deactivates an active expense type', async () => {
    setUpMocks();
    const user = userEvent.setup();
    renderWithProviders(<ExpenseTypeListPage />, { auth: { user: adminUser, isInitialized: true } });

    await screen.findByText('Cleaning');
    const row = screen.getByText('Cleaning').closest('tr')!;
    await user.click(within(row).getByRole('button', { name: /actions for cleaning/i }));
    await user.click(await screen.findByRole('menuitem', { name: /^deactivate$/i }));

    await waitFor(() => {
      expect(within(row).getByText('Inactive')).toBeInTheDocument();
    });
  });
});
