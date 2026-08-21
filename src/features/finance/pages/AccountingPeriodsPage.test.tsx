import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { AccountingPeriodsPage } from './AccountingPeriodsPage';

const API_BASE = 'https://localhost:7219';

const treasurer: AuthUser = {
  id: 'user-1',
  email: 'treasurer@example.com',
  name: 'Treasurer',
  tenantId: 'tenant-1',
  roles: ['Treasurer'],
  permissions: ['finance.period.manage', 'finance.period.close', 'finance.period.reopen'],
  buildingIds: [],
  buildingPermissions: [],
};

const viewOnlyUser: AuthUser = { ...treasurer, permissions: [] };

function setUpMocks() {
  server.use(
    http.get(`${API_BASE}/api/v1/finance/financial-years`, () =>
      HttpResponse.json([{ financialYearId: 'fy-1', name: 'FY 2026', startDate: '2026-01-01', endDate: '2026-12-31', status: 'Open' }]),
    ),
    http.get(`${API_BASE}/api/v1/finance/accounting-periods`, () =>
      HttpResponse.json([
        { accountingPeriodId: 'period-open', financialYearId: 'fy-1', name: '2026-08', startDate: '2026-08-01', endDate: '2026-08-31', status: 'Open' },
        { accountingPeriodId: 'period-closed', financialYearId: 'fy-1', name: '2026-07', startDate: '2026-07-01', endDate: '2026-07-31', status: 'Closed' },
      ]),
    ),
    http.post(`${API_BASE}/api/v1/finance/accounting-periods`, () =>
      HttpResponse.json({ accountingPeriodId: 'period-new', financialYearId: 'fy-1', name: '2026-09', startDate: '2026-09-01', endDate: '2026-09-30', status: 'Open' }),
    ),
  );
}

describe('AccountingPeriodsPage', () => {
  it('auto-selects the first financial year and lists its periods with status badges', async () => {
    setUpMocks();
    renderWithProviders(<AccountingPeriodsPage />, { auth: { user: treasurer, isInitialized: true } });

    expect(await screen.findByText('2026-08')).toBeInTheDocument();
    expect(screen.getByText('2026-07')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('hides Add Period for a user without finance.period.manage', async () => {
    setUpMocks();
    renderWithProviders(<AccountingPeriodsPage />, { auth: { user: viewOnlyUser, isInitialized: true } });

    await screen.findByText('2026-08');
    expect(screen.queryByRole('button', { name: /add period/i })).not.toBeInTheDocument();
  });

  it('creates a new accounting period', async () => {
    setUpMocks();
    let capturedBody: unknown = null;
    server.use(
      http.post(`${API_BASE}/api/v1/finance/accounting-periods`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ accountingPeriodId: 'period-new', financialYearId: 'fy-1', name: '2026-09', startDate: '2026-09-01', endDate: '2026-09-30', status: 'Open' });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<AccountingPeriodsPage />, { auth: { user: treasurer, isInitialized: true } });

    await screen.findByText('2026-08');
    await user.click(screen.getByRole('button', { name: /add period/i }));
    await user.type(screen.getByLabelText('Name'), '2026-09');
    await user.type(screen.getByLabelText('Start date'), '2026-09-01');
    await user.type(screen.getByLabelText('End date'), '2026-09-30');
    await user.click(screen.getByRole('button', { name: /create period/i }));

    await waitFor(() => {
      expect(capturedBody).toMatchObject({ financialYearId: 'fy-1', name: '2026-09', startDate: '2026-09-01', endDate: '2026-09-30' });
    });
  });
});
