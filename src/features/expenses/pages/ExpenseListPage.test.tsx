import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor, within } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { ExpenseListPage } from './ExpenseListPage';

const API_BASE = 'https://localhost:7219';

const adminUser: AuthUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin',
  tenantId: 'tenant-1',
  roles: ['SuperAdmin'],
  permissions: ['expense.view', 'expense.manage'],
  buildingIds: [],
  buildingPermissions: [],
};

const viewOnlyUser: AuthUser = { ...adminUser, permissions: ['expense.view'] };

const baseExpenses = [
  {
    expenseId: 'exp-1', buildingId: 'b-1', buildingName: 'Tower A', expenseTypeId: 'type-1', expenseTypeName: 'Cleaning',
    expenseDate: '2026-08-01', description: 'Monthly cleaning', payee: 'ABC Cleaners', referenceNumber: 'INV-001',
    amount: 1500, paymentMethod: 'Cash', notes: null, status: 'Recorded', voidReason: null,
    createdBy: null, createdAtUtc: '2026-08-01T00:00:00Z', updatedAtUtc: null,
  },
];

function setUpMocks() {
  server.use(
    http.get(`${API_BASE}/api/v1/expenses`, () =>
      HttpResponse.json({ items: baseExpenses, page: 1, pageSize: 10, total: baseExpenses.length }),
    ),
    http.get(`${API_BASE}/api/v1/expense-types/active`, () =>
      HttpResponse.json([{ expenseTypeId: 'type-1', name: 'Cleaning', code: 'CLN', description: null, isActive: true, displayOrder: 1 }]),
    ),
    http.get(`${API_BASE}/api/v1/properties/buildings`, () =>
      HttpResponse.json({ items: [{ buildingId: 'b-1', name: 'Tower A', code: 'TA' }], page: 1, pageSize: 100, totalCount: 1 }),
    ),
    http.post(`${API_BASE}/api/v1/expenses`, () =>
      HttpResponse.json({ ...baseExpenses[0], expenseId: 'exp-new', description: 'New expense' }),
    ),
    http.post(`${API_BASE}/api/v1/expenses/:id/void`, () => new HttpResponse(null, { status: 204 })),
  );
}

describe('ExpenseListPage', () => {
  it('renders the expense register', async () => {
    setUpMocks();
    renderWithProviders(<ExpenseListPage />, { auth: { user: adminUser, isInitialized: true } });

    expect(await screen.findByText('Monthly cleaning')).toBeInTheDocument();
    expect(screen.getByText('ABC Cleaners')).toBeInTheDocument();
    expect(screen.getByText('Recorded')).toBeInTheDocument();
  });

  it('hides Add Expense and row actions for a user without expense.manage', async () => {
    setUpMocks();
    renderWithProviders(<ExpenseListPage />, { auth: { user: viewOnlyUser, isInitialized: true } });

    await screen.findByText('Monthly cleaning');
    expect(screen.queryByRole('button', { name: /add expense/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /void/i })).not.toBeInTheDocument();
  });

  it('records a new expense', async () => {
    setUpMocks();
    const user = userEvent.setup();
    renderWithProviders(<ExpenseListPage />, { auth: { user: adminUser, isInitialized: true } });

    await screen.findByText('Monthly cleaning');
    await user.click(screen.getByRole('button', { name: /add expense/i }));

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByText('Select a building').closest('button')!);
    await user.click(await screen.findByRole('option', { name: 'Tower A (TA)' }));

    await user.click(within(dialog).getByText('Select a type').closest('button')!);
    await user.click(await screen.findByRole('option', { name: 'Cleaning' }));

    await user.type(within(dialog).getByLabelText('Description'), 'New expense');
    await user.type(within(dialog).getByLabelText('Amount'), '500');
    await user.click(within(dialog).getByRole('button', { name: /record expense/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('voids a recorded expense with a reason', async () => {
    setUpMocks();
    const user = userEvent.setup();
    renderWithProviders(<ExpenseListPage />, { auth: { user: adminUser, isInitialized: true } });

    await screen.findByText('Monthly cleaning');
    await user.click(screen.getByRole('button', { name: /^void$/i }));

    const alert = await screen.findByRole('alertdialog');
    await user.type(within(alert).getByLabelText('Reason'), 'Recorded in error');
    await user.click(within(alert).getByRole('button', { name: /void expense/i }));

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });
});
