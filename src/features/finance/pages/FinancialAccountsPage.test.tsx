import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { FinancialAccountsPage } from './FinancialAccountsPage';

const API_BASE = 'https://localhost:7219';

const treasurer: AuthUser = {
  id: 'user-1',
  email: 'treasurer@example.com',
  name: 'Treasurer',
  tenantId: 'tenant-1',
  roles: ['Treasurer'],
  permissions: ['finance.bankaccount.view', 'finance.bankaccount.manage'],
  buildingIds: [],
  buildingPermissions: [],
};

const viewOnlyUser: AuthUser = { ...treasurer, permissions: ['finance.bankaccount.view'] };

function setUpMocks() {
  server.use(
    http.get(`${API_BASE}/api/v1/finance/financial-accounts`, () =>
      HttpResponse.json([
        {
          financialAccountId: 'account-1',
          name: 'Main Operating Account',
          accountType: 'Bank',
          bankName: 'Test Bank',
          branchName: 'Gulshan',
          accountNumber: '12345',
          chartOfAccountId: 'coa-1',
          fundId: null,
          fundName: null,
          notes: null,
          isActive: true,
        },
      ]),
    ),
    http.get(`${API_BASE}/api/v1/finance/funds`, () => HttpResponse.json([])),
  );
}

describe('FinancialAccountsPage', () => {
  it('lists financial accounts with their status', async () => {
    setUpMocks();
    renderWithProviders(<FinancialAccountsPage />, { auth: { user: treasurer, isInitialized: true } });

    expect(await screen.findByText('Main Operating Account')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('hides Add Account for a user without finance.bankaccount.manage', async () => {
    setUpMocks();
    renderWithProviders(<FinancialAccountsPage />, { auth: { user: viewOnlyUser, isInitialized: true } });

    await screen.findByText('Main Operating Account');
    expect(screen.queryByRole('button', { name: /add account/i })).not.toBeInTheDocument();
  });

  it('creates a new financial account', async () => {
    setUpMocks();
    let capturedBody: unknown = null;
    server.use(
      http.post(`${API_BASE}/api/v1/finance/financial-accounts`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({
          financialAccountId: 'account-new',
          name: 'Reserve Fund Account',
          accountType: 'Bank',
          bankName: null,
          branchName: null,
          accountNumber: null,
          chartOfAccountId: 'coa-2',
          fundId: null,
          fundName: null,
          notes: null,
          isActive: true,
        });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<FinancialAccountsPage />, { auth: { user: treasurer, isInitialized: true } });

    await screen.findByText('Main Operating Account');
    await user.click(screen.getByRole('button', { name: /add account/i }));
    await user.type(screen.getByLabelText('Name'), 'Reserve Fund Account');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(capturedBody).toMatchObject({ name: 'Reserve Fund Account', accountType: 'Bank' });
    });
  });
});
