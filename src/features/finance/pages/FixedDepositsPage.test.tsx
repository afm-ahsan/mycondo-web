import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { FixedDepositsPage } from './FixedDepositsPage';

const API_BASE = 'https://localhost:7219';

const treasurer: AuthUser = {
  id: 'user-1',
  email: 'treasurer@example.com',
  name: 'Treasurer',
  tenantId: 'tenant-1',
  roles: ['Treasurer'],
  permissions: ['finance.fixeddeposit.view', 'finance.fixeddeposit.place', 'finance.fixeddeposit.manage', 'finance.fixeddeposit.interest.record'],
  buildingIds: [],
  buildingPermissions: [],
};

const viewOnlyUser: AuthUser = { ...treasurer, permissions: ['finance.fixeddeposit.view'] };

const fixedDeposit = {
  fixedDepositId: 'fd-1',
  certificateNumber: 'CERT-001',
  bankName: 'Test Bank',
  branchName: 'Gulshan',
  fundingFinancialAccountId: 'account-1',
  fundingFinancialAccountName: 'Main Operating Account',
  receivingFinancialAccountId: null,
  receivingFinancialAccountName: null,
  fundId: null,
  fundName: null,
  principal: 100000,
  interestRatePercent: 6.5,
  calculationMethod: 'Simple',
  paymentFrequency: 'Monthly',
  startDate: '2026-01-01',
  maturityDate: '2027-01-01',
  isMatured: false,
  expectedGrossInterest: null,
  expectedDeductionRatePercent: null,
  notes: null,
  status: 'Active',
  predecessorFixedDepositId: null,
  successorFixedDepositId: null,
  totalInterestAccrued: 0,
  totalInterestReceivedGross: 0,
  outstandingInterestReceivable: 0,
  voidReason: null,
};

function setUpMocks() {
  server.use(
    http.get(`${API_BASE}/api/v1/finance/fixed-deposits`, () =>
      HttpResponse.json({ items: [fixedDeposit], page: 1, pageSize: 20, total: 1 }),
    ),
    http.get(`${API_BASE}/api/v1/finance/funds`, () => HttpResponse.json([])),
    http.get(`${API_BASE}/api/v1/finance/financial-accounts`, () => HttpResponse.json([])),
  );
}

describe('FixedDepositsPage', () => {
  it('lists fixed deposits with their status', async () => {
    setUpMocks();
    renderWithProviders(<FixedDepositsPage />, { auth: { user: treasurer, isInitialized: true } });

    expect(await screen.findByText('CERT-001')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('hides Place Fixed Deposit for a user without finance.fixeddeposit.place', async () => {
    setUpMocks();
    renderWithProviders(<FixedDepositsPage />, { auth: { user: viewOnlyUser, isInitialized: true } });

    await screen.findByText('CERT-001');
    expect(screen.queryByRole('button', { name: /place fixed deposit/i })).not.toBeInTheDocument();
  });

  it('navigates to the detail view and shows interest sections', async () => {
    setUpMocks();
    server.use(
      http.get(`${API_BASE}/api/v1/finance/fixed-deposits/fd-1`, () =>
        HttpResponse.json({ fixedDeposit, interestAccruals: [], interestReceipts: [] }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<FixedDepositsPage />, { auth: { user: treasurer, isInitialized: true } });

    await screen.findByText('CERT-001');
    await user.click(screen.getByRole('button', { name: /view/i }));

    await waitFor(() => {
      expect(screen.getByText('Interest Accruals')).toBeInTheDocument();
    });
    expect(screen.getByText('Interest Receipts')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /renew/i })).toBeInTheDocument();
  });
});
