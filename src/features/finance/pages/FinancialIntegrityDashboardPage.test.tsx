import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { FinancialIntegrityDashboardPage } from './FinancialIntegrityDashboardPage';

const API_BASE = 'https://localhost:7219';

const user: AuthUser = {
  id: 'user-1',
  email: 'treasurer@example.com',
  name: 'Treasurer',
  tenantId: 'tenant-1',
  roles: ['Treasurer'],
  permissions: ['finance.report.view'],
  buildingIds: [],
  buildingPermissions: [],
};

describe('FinancialIntegrityDashboardPage', () => {
  it('shows a healthy summary and zero counts when every check passes', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/finance/integrity-dashboard`, () =>
        HttpResponse.json({
          unbalancedPostingsCount: 0,
          duplicateLogicalPostingsCount: 0,
          closedPeriodViolationsCount: 0,
          staleUnreconciledBankItemsCount: 0,
          staleUnreceivedInterestAccrualsCount: 0,
          isHealthy: true,
        }),
      ),
    );
    renderWithProviders(<FinancialIntegrityDashboardPage />, { auth: { user, isInitialized: true } });

    expect(await screen.findByText('Healthy')).toBeInTheDocument();
    expect(screen.getByText('Unbalanced postings')).toBeInTheDocument();
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  it('flags attention required and surfaces the failing count when a check finds a defect', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/finance/integrity-dashboard`, () =>
        HttpResponse.json({
          unbalancedPostingsCount: 2,
          duplicateLogicalPostingsCount: 0,
          closedPeriodViolationsCount: 0,
          staleUnreconciledBankItemsCount: 0,
          staleUnreceivedInterestAccrualsCount: 0,
          isHealthy: false,
        }),
      ),
    );
    renderWithProviders(<FinancialIntegrityDashboardPage />, { auth: { user, isInitialized: true } });

    expect(await screen.findByText('Attention required')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
