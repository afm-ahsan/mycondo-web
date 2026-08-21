import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { BankReconciliationPage } from './BankReconciliationPage';

const API_BASE = 'https://localhost:7219';

const treasurer: AuthUser = {
  id: 'user-1',
  email: 'treasurer@example.com',
  name: 'Treasurer',
  tenantId: 'tenant-1',
  roles: ['Treasurer'],
  permissions: ['finance.reconciliation.view', 'finance.reconciliation.manage', 'finance.reconciliation.reconcile'],
  buildingIds: [],
  buildingPermissions: [],
};

function setUpMocks() {
  server.use(
    http.get(`${API_BASE}/api/v1/finance/financial-accounts`, () =>
      HttpResponse.json([
        { financialAccountId: 'account-1', name: 'Main Operating Account', accountType: 'Bank', bankName: 'Test Bank', branchName: null, accountNumber: null, chartOfAccountId: 'coa-1', fundId: null, fundName: null, notes: null, isActive: true },
      ]),
    ),
    http.get(`${API_BASE}/api/v1/finance/bank-reconciliations`, () =>
      HttpResponse.json([
        { bankReconciliationId: 'recon-1', financialAccountId: 'account-1', statementDate: '2026-08-31', statementBalance: 10000, openingLedgerBalance: 9500, status: 'InProgress', reconciledAtUtc: null },
      ]),
    ),
  );
}

describe('BankReconciliationPage', () => {
  it('prompts for a Financial Account before showing any reconciliation history', async () => {
    setUpMocks();
    renderWithProviders(<BankReconciliationPage />, { auth: { user: treasurer, isInitialized: true } });

    expect(await screen.findByText('Select a Financial Account')).toBeInTheDocument();
  });

  it('lists reconciliations for the selected Financial Account', async () => {
    setUpMocks();
    const user = userEvent.setup();
    renderWithProviders(<BankReconciliationPage />, { auth: { user: treasurer, isInitialized: true } });

    await user.click(await screen.findByRole('combobox', { name: /financial account/i }));
    await user.click(await screen.findByRole('option', { name: 'Main Operating Account' }));

    expect(await screen.findByText('InProgress')).toBeInTheDocument();
  });

  it('starts a new reconciliation and navigates to its detail view', async () => {
    setUpMocks();
    let capturedBody: unknown = null;
    server.use(
      http.post(`${API_BASE}/api/v1/finance/bank-reconciliations`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ bankReconciliationId: 'recon-new', financialAccountId: 'account-1', statementDate: '2026-09-30', statementBalance: 12000, openingLedgerBalance: 11500, status: 'InProgress', reconciledAtUtc: null });
      }),
      http.get(`${API_BASE}/api/v1/finance/bank-reconciliations/recon-new`, () =>
        HttpResponse.json({
          reconciliation: { bankReconciliationId: 'recon-new', financialAccountId: 'account-1', statementDate: '2026-09-30', statementBalance: 12000, openingLedgerBalance: 11500, status: 'InProgress', reconciledAtUtc: null },
          lines: [],
        }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<BankReconciliationPage />, { auth: { user: treasurer, isInitialized: true } });

    await user.click(await screen.findByRole('combobox', { name: /financial account/i }));
    await user.click(await screen.findByRole('option', { name: 'Main Operating Account' }));
    await user.click(await screen.findByRole('button', { name: /start reconciliation/i }));
    await user.type(screen.getByLabelText('Statement date'), '2026-09-30');
    await user.type(screen.getByLabelText('Statement balance'), '12000');
    await user.click(screen.getByRole('button', { name: /start reconciliation/i }));

    await waitFor(() => {
      expect(capturedBody).toMatchObject({ financialAccountId: 'account-1', statementDate: '2026-09-30', statementBalance: '12000' });
    });
    expect(await screen.findByText('No statement lines yet')).toBeInTheDocument();
  });
});
