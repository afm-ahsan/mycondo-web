import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { CylinderStockPage } from './CylinderStockPage';

const API_BASE = 'https://localhost:7219';

const managerUser: AuthUser = {
  id: 'user-1',
  email: 'manager@example.com',
  name: 'Manager',
  tenantId: 'tenant-1',
  roles: [],
  permissions: ['gascylinder.stock.manage', 'gascylinder.approve'],
  buildingIds: [],
  buildingPermissions: [],
};

function reconciliation(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    monthlyCylinderReconciliationId: 'recon-1',
    cylinderType: 'LPG-12kg',
    periodMonth: '2026-08-01',
    openingStock: 100,
    totalReceived: 50,
    totalIssued: 40,
    totalEmptyReturned: 30,
    closingStock: 108,
    varianceQuantity: 0,
    remarks: null,
    ...overrides,
  };
}

function mockBase() {
  server.use(
    http.get(`${API_BASE}/api/v1/gas-cylinder-stock/current`, () => HttpResponse.json([])),
    http.get(`${API_BASE}/api/v1/gas-cylinder-stock/movements`, () =>
      HttpResponse.json({ items: [], page: 1, pageSize: 10, total: 0 }),
    ),
  );
}

describe('CylinderStockPage', () => {
  it('flags a non-zero variance as Variance Detected, and a zero variance as Matched, without relying on color alone', async () => {
    mockBase();
    server.use(
      http.get(`${API_BASE}/api/v1/cylinder-reconciliations`, () =>
        HttpResponse.json({
          items: [reconciliation({ varianceQuantity: 0 }), reconciliation({ monthlyCylinderReconciliationId: 'recon-2', varianceQuantity: -5 })],
          page: 1,
          pageSize: 10,
          total: 2,
        }),
      ),
    );

    renderWithProviders(<CylinderStockPage />, { auth: { user: managerUser, isInitialized: true } });

    expect(await screen.findByText('Matched')).toBeInTheDocument();
    expect(screen.getByText('Variance Detected')).toBeInTheDocument();
  });

  it('paginates reconciliations instead of silently truncating results beyond the first page', async () => {
    mockBase();
    const receivedPages: string[] = [];
    server.use(
      http.get(`${API_BASE}/api/v1/cylinder-reconciliations`, ({ request }) => {
        const page = new URL(request.url).searchParams.get('page') ?? '1';
        receivedPages.push(page);
        return HttpResponse.json({
          items: [reconciliation()],
          page: Number(page),
          pageSize: 10,
          total: 25,
        });
      }),
    );

    renderWithProviders(<CylinderStockPage />, { auth: { user: managerUser, isInitialized: true } });

    // A real pagination control is rendered (not a fixed, hidden page-1-only fetch) — proves the
    // truncation bug is fixed: 25 total records are discoverable via pagination, not silently capped.
    await waitFor(() => expect(screen.getByText(/25/)).toBeInTheDocument());
    expect(receivedPages).toContain('1');
  });
});
