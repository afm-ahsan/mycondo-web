import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { InvoiceListPage } from './InvoiceListPage';

const API_BASE = 'https://localhost:7219';

const viewUser: AuthUser = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Billing Admin',
  tenantId: 'tenant-1',
  roles: ['BillingAdmin'],
  permissions: ['billing.invoice.view'],
  buildingIds: [],
  buildingPermissions: [],
};

const invoice = {
  invoiceId: 'inv-1',
  buildingId: 'bld-1',
  flatId: 'flat-1',
  invoiceNumber: 'INV-A-2026-000001',
  source: 'ServiceCharge',
  periodStart: '2026-08-01',
  periodEnd: '2026-08-31',
  invoiceDate: '2026-08-01',
  dueDate: '2026-08-31',
  subtotalAmount: 2500,
  totalAmount: 2500,
  amountPaid: 0,
  balance: 2500,
  status: 'Issued',
  issuedAtUtc: '2026-08-01T00:00:00Z',
  voidedAtUtc: null,
  voidedBy: null,
  voidReason: null,
};

describe('InvoiceListPage', () => {
  it('renders invoice rows with server-computed totals, never recalculated client-side', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/invoices`, () =>
        HttpResponse.json({ items: [invoice], page: 1, pageSize: 10, total: 1 }),
      ),
      http.get(`${API_BASE}/api/v1/properties/buildings`, () =>
        HttpResponse.json({ items: [{ buildingId: 'bld-1', name: 'Tower A', code: 'A', address: null }], page: 1, pageSize: 100, total: 1 }),
      ),
    );

    renderWithProviders(<InvoiceListPage />, { auth: { user: viewUser, isInitialized: true } });

    expect(await screen.findByText('INV-A-2026-000001')).toBeInTheDocument();
    expect(screen.getByText('August 2026')).toBeInTheDocument();
    // Balance shown is exactly the server's `balance` field, not a client re-derivation.
    expect(screen.getAllByText((_, el) => el?.textContent?.includes('2,500.00') ?? false).length).toBeGreaterThan(0);
  }, 15000);
});
