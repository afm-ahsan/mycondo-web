import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { DashboardPage } from './DashboardPage';

const API_BASE = 'https://localhost:7219';

function makeUser(permissions: string[]): AuthUser {
  return {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    tenantId: 'tenant-1',
    roles: [],
    permissions,
    buildingIds: [],
    buildingPermissions: [],
  };
}

const ALL_REPORT_PERMISSIONS = [
  'report.financial.view',
  'report.security.view',
  'report.facility',
  'utility.report',
  'generator.report',
  'gascylinder.view',
];

function financialSummary() {
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
  };
}

function securitySummary() {
  return {
    currentlyInside: [{ category: 'Guest', count: 4 }],
    parcelsAwaitingCollectionCount: 3,
  };
}

function mockAllReportEndpoints() {
  server.use(
    http.get(`${API_BASE}/api/v1/reports/financial/summary`, () => HttpResponse.json(financialSummary())),
    http.get(`${API_BASE}/api/v1/reports/security/summary`, () => HttpResponse.json(securitySummary())),
    http.get(`${API_BASE}/api/v1/reports/facilities/utilization`, () => HttpResponse.json([])),
    http.get(`${API_BASE}/api/v1/reports/facilities/booking-revenue`, () => HttpResponse.json([])),
    http.get(`${API_BASE}/api/v1/reports/utilities/consumption-summary`, () => HttpResponse.json([])),
    http.get(`${API_BASE}/api/v1/reports/utilities/reading-status-summary`, () => HttpResponse.json([])),
    http.get(`${API_BASE}/api/v1/reports/operations/generators/maintenance-due`, () => HttpResponse.json([])),
    http.get(`${API_BASE}/api/v1/cylinder-stock-movements/current`, () => HttpResponse.json([])),
  );
}

describe('DashboardPage — permission gating', () => {
  it('renders no summary section and fetches nothing when the user holds no report permissions', async () => {
    let financialCalled = false;
    server.use(
      http.get(`${API_BASE}/api/v1/reports/financial/summary`, () => {
        financialCalled = true;
        return HttpResponse.json(financialSummary());
      }),
    );

    renderWithProviders(<DashboardPage />, { auth: { user: makeUser([]), isInitialized: true } });

    expect(screen.queryByText('Financial')).not.toBeInTheDocument();
    expect(screen.queryByText('Security & Front Desk')).not.toBeInTheDocument();
    expect(screen.queryByText('Facilities')).not.toBeInTheDocument();
    expect(screen.queryByText('Utilities')).not.toBeInTheDocument();
    expect(screen.queryByText('Operations')).not.toBeInTheDocument();
    // Give any accidental fetch a moment to fire before asserting it never did.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(financialCalled).toBe(false);
  });

  it('shows only the Security section when the user holds only report.security.view', async () => {
    mockAllReportEndpoints();
    renderWithProviders(<DashboardPage />, {
      auth: { user: makeUser(['report.security.view']), isInitialized: true },
    });

    expect(await screen.findByText('Security & Front Desk')).toBeInTheDocument();
    expect(screen.queryByText('Financial')).not.toBeInTheDocument();
    expect(screen.queryByText('Utilities')).not.toBeInTheDocument();
  });

  it('shows Operations with only the generator KPI when the user lacks gascylinder.view', async () => {
    mockAllReportEndpoints();
    renderWithProviders(<DashboardPage />, {
      auth: { user: makeUser(['generator.report']), isInitialized: true },
    });

    expect(await screen.findByText('Operations')).toBeInTheDocument();
    expect(screen.getByText('Generator maintenance due')).toBeInTheDocument();
    expect(screen.queryByText('Gas cylinder stock')).not.toBeInTheDocument();
  });
});

describe('DashboardPage — accessibility smoke', () => {
  it('has no detectable axe violations with a full set of report permissions', async () => {
    mockAllReportEndpoints();
    const { container } = renderWithProviders(<DashboardPage />, {
      auth: { user: makeUser(ALL_REPORT_PERMISSIONS), isInitialized: true },
    });

    await waitFor(() => expect(screen.getByText('Financial')).toBeInTheDocument());

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('DashboardPage — widget failure isolation', () => {
  it('shows an inline error for the Financial section while other sections still render their data', async () => {
    mockAllReportEndpoints();
    server.use(
      http.get(`${API_BASE}/api/v1/reports/financial/summary`, () => HttpResponse.json({ message: 'boom' }, { status: 500 })),
    );

    renderWithProviders(<DashboardPage />, {
      auth: { user: makeUser(ALL_REPORT_PERMISSIONS), isInitialized: true },
    });

    // Financial section reports its own failure, not a blank/crashed page.
    expect(await screen.findByText("Couldn't load the financial summary.")).toBeInTheDocument();

    // A sibling section (Security) still renders its real data despite Financial's failure.
    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument()); // parcelsAwaitingCollectionCount
    expect(screen.getByText('Security & Front Desk')).toBeInTheDocument();
    expect(screen.getByText('Facilities')).toBeInTheDocument();
    expect(screen.getByText('Utilities')).toBeInTheDocument();
    expect(screen.getByText('Operations')).toBeInTheDocument();
  });
});
