import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { ReceivablesAgeingReportPage } from './ReceivablesAgeingReportPage';

const API_BASE = 'https://localhost:7219';

const user: AuthUser = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'Test User',
  tenantId: 'tenant-1',
  roles: [],
  permissions: ['report.financial.view'],
  buildingIds: [],
  buildingPermissions: [],
};

function ageing() {
  return {
    asOfDate: '2026-08-15',
    buckets: [
      { bucketLabel: 'Current', minDaysOverdue: null, maxDaysOverdue: 0, invoiceCount: 2, totalBalance: 400 },
      { bucketLabel: '1-30 days', minDaysOverdue: 1, maxDaysOverdue: 30, invoiceCount: 1, totalBalance: 600 },
      { bucketLabel: '31-60 days', minDaysOverdue: 31, maxDaysOverdue: 60, invoiceCount: 0, totalBalance: 0 },
      { bucketLabel: '61-90 days', minDaysOverdue: 61, maxDaysOverdue: 90, invoiceCount: 0, totalBalance: 0 },
      { bucketLabel: '91+ days', minDaysOverdue: 91, maxDaysOverdue: null, invoiceCount: 1, totalBalance: 800 },
    ],
    grandTotal: 1800,
  };
}

describe('ReceivablesAgeingReportPage', () => {
  it('renders all 5 fixed buckets, including zero-balance ones, and the grand total', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/reports/financial/receivables-ageing`, () => HttpResponse.json(ageing())),
      http.get(`${API_BASE}/api/v1/properties/buildings`, () => HttpResponse.json({ items: [], page: 1, pageSize: 100, total: 0 })),
    );

    renderWithProviders(<ReceivablesAgeingReportPage />, { auth: { user, isInitialized: true } });

    expect(await screen.findByText('Current')).toBeInTheDocument();
    expect(screen.getByText('1-30 days')).toBeInTheDocument();
    expect(screen.getByText('31-60 days')).toBeInTheDocument();
    expect(screen.getByText('61-90 days')).toBeInTheDocument();
    expect(screen.getByText('91+ days')).toBeInTheDocument();
    expect(screen.getByText('Total outstanding')).toBeInTheDocument();
  });
});
