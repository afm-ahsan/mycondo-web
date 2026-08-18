import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import { createStore } from '@/store/store';
import { server } from '@/test/server';
import type { AuthUser } from '@/store/slices/authSlice';
import { PageHeaderProvider } from '@/providers/page-header-provider';
import { InvoiceDetailPage } from './InvoiceDetailPage';

const API_BASE = 'https://localhost:7219';

function invoiceDetail(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    invoice: {
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
    },
    lines: [
      {
        invoiceLineId: 'line-1',
        serviceChargeRuleId: 'rule-1',
        ruleNameSnapshot: 'Monthly Maintenance',
        ruleCategorySnapshot: 'Maintenance',
        calculationMethodSnapshot: 'FixedAmount',
        rateSnapshot: 2500,
        areaSqFtSnapshot: null,
        quantity: 1,
        lineAmount: 2500,
        description: 'Monthly Maintenance (Maintenance)',
      },
    ],
  };
}

function renderDetailPage(user: AuthUser, detail: ReturnType<typeof invoiceDetail>) {
  server.use(http.get(`${API_BASE}/api/v1/invoices/inv-1`, () => HttpResponse.json(detail)));

  const store = createStore({ auth: { user, isInitialized: true } });
  return render(
    <MemoryRouter initialEntries={['/billing/invoices/inv-1']}>
      <Provider store={store}>
        <PageHeaderProvider>
          <Routes>
            <Route path="/billing/invoices/:id" element={<InvoiceDetailPage />} />
          </Routes>
        </PageHeaderProvider>
      </Provider>
    </MemoryRouter>,
  );
}

const adminUser: AuthUser = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Billing Admin',
  tenantId: 'tenant-1',
  roles: ['BillingAdmin'],
  permissions: ['billing.invoice.view', 'billing.invoice.void'],
  buildingIds: [],
  buildingPermissions: [],
};

describe('InvoiceDetailPage', () => {
  it('renders the stored line snapshot, not a recalculation', async () => {
    renderDetailPage(adminUser, invoiceDetail());

    expect(await screen.findByRole('heading', { name: 'INV-A-2026-000001' })).toBeInTheDocument();
    expect(screen.getByText('Monthly Maintenance (Maintenance)')).toBeInTheDocument();
    expect(screen.getByText('Fixed Amount')).toBeInTheDocument();
  }, 15000);

  it('shows Void only for a fully-unpaid Issued invoice, and sends an idempotency key when voiding', async () => {
    let receivedKey: string | null = null;
    let receivedBody: unknown = null;

    renderDetailPage(adminUser, invoiceDetail({ status: 'Issued', amountPaid: 0 }));
    server.use(
      http.post(`${API_BASE}/api/v1/invoices/inv-1/void`, async ({ request }) => {
        receivedKey = request.headers.get('X-Idempotency-Key');
        receivedBody = await request.json();
        return HttpResponse.json({ ...invoiceDetail().invoice, status: 'Void', voidReason: 'Issued in error' });
      }),
    );

    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'INV-A-2026-000001' });

    await user.click(screen.getByRole('button', { name: /^void$/i }));
    await user.type(screen.getByLabelText('Reason'), 'Issued in error');
    await user.click(screen.getByRole('button', { name: /^void invoice$/i }));

    await waitFor(() => expect(receivedBody).toEqual({ reason: 'Issued in error' }));
    expect(receivedKey).not.toBeNull();
  }, 15000);

  it('does not show Void for a partially-paid invoice', async () => {
    renderDetailPage(adminUser, invoiceDetail({ status: 'PartiallyPaid', amountPaid: 1000, balance: 1500 }));

    await screen.findByRole('heading', { name: 'INV-A-2026-000001' });
    expect(screen.queryByRole('button', { name: /^void$/i })).not.toBeInTheDocument();
  }, 15000);
});
