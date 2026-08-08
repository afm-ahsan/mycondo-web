import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { OutstandingInvoicesPage } from './OutstandingInvoicesPage';

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

function invoice(overrides: Partial<Record<string, unknown>> = {}) {
  return {
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
    ...overrides,
  };
}

describe('OutstandingInvoicesPage', () => {
  it('defaults to the Issued tab and switches status filter to Partially Paid on tab click, without ever showing a summed total', async () => {
    const receivedStatuses: (string | null)[] = [];
    server.use(
      http.get(`${API_BASE}/api/v1/invoices`, ({ request }) => {
        const url = new URL(request.url);
        const status = url.searchParams.get('status');
        receivedStatuses.push(status);
        return HttpResponse.json({
          items: [invoice({ status: status ?? 'Issued' })],
          page: 1,
          pageSize: 10,
          total: 1,
        });
      }),
      http.get(`${API_BASE}/api/v1/properties/buildings`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 100, total: 0 }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<OutstandingInvoicesPage />, { auth: { user: viewUser, isInitialized: true } });

    await waitFor(() => expect(receivedStatuses).toContain('Issued'));

    await user.click(screen.getByRole('tab', { name: 'Partially Paid' }));
    await waitFor(() => expect(receivedStatuses).toContain('PartiallyPaid'));

    // No aggregate/summed KPI is ever rendered on this page — only the per-invoice server balance.
    expect(screen.queryByText(/total outstanding/i)).not.toBeInTheDocument();
  }, 15000);
});
