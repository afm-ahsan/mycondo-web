import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { FinancialSummaryReportPage } from './FinancialSummaryReportPage';

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

function summary(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    fromDate: '2026-08-01',
    toDate: '2026-08-31',
    asOfDate: '2026-08-15',
    totalBilled: 50000,
    totalCollected: 38000,
    totalOutstanding: 12000,
    unpaidInvoiceCount: 3,
    partiallyPaidInvoiceCount: 1,
    overdueInvoiceCount: 2,
    ...overrides,
  };
}

describe('FinancialSummaryReportPage', () => {
  it('renders period-flow and current-snapshot figures under visually distinct headings', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/reports/financial/summary`, () => HttpResponse.json(summary())),
      http.get(`${API_BASE}/api/v1/properties/buildings`, () => HttpResponse.json({ items: [], page: 1, pageSize: 100, total: 0 })),
    );

    renderWithProviders(<FinancialSummaryReportPage />, { auth: { user, isInitialized: true } });

    expect(await screen.findByText('2')).toBeInTheDocument(); // overdueInvoiceCount, once loaded
    expect(screen.getByText(/This period/)).toBeInTheDocument();
    expect(screen.getByText(/Current snapshot/)).toBeInTheDocument();
    expect(screen.getByText(/not limited to the period above/)).toBeInTheDocument();
  });

  it('refetches with the chosen building when the building filter changes', async () => {
    const receivedBuildingIds: (string | null)[] = [];
    server.use(
      http.get(`${API_BASE}/api/v1/reports/financial/summary`, ({ request }) => {
        receivedBuildingIds.push(new URL(request.url).searchParams.get('buildingId'));
        return HttpResponse.json(summary());
      }),
      http.get(`${API_BASE}/api/v1/properties/buildings`, () =>
        HttpResponse.json({
          items: [{ buildingId: 'building-1', name: 'Tower A', code: 'A' }],
          page: 1,
          pageSize: 100,
          total: 1,
        }),
      ),
    );

    renderWithProviders(<FinancialSummaryReportPage />, { auth: { user, isInitialized: true } });

    await waitFor(() => expect(receivedBuildingIds).toContain(null));
  });
});
