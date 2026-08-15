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
import { PaymentDetailPage } from './PaymentDetailPage';

const API_BASE = 'https://localhost:7219';

function payment(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    paymentId: 'payment-1',
    flatId: 'flat-1',
    amount: 3000,
    paymentMethod: 'Cash',
    referenceNumber: 'RCPT-001',
    businessDate: '2026-08-08',
    receivedBy: null,
    status: 'Posted',
    ledgerPostingId: 'posting-1',
    reversedAtUtc: null,
    reversedBy: null,
    reversalReason: null,
    allocations: [
      { paymentAllocationId: 'alloc-1', invoiceId: 'inv-1', invoiceNumber: 'INV-A-2026-000001', allocatedAmount: 3000, allocatedAtUtc: '2026-08-08T00:00:00Z' },
    ],
    ...overrides,
  };
}

function renderDetailPage(user: AuthUser, initialPayment: ReturnType<typeof payment>) {
  server.use(http.get(`${API_BASE}/api/v1/payments/payment-1`, () => HttpResponse.json(initialPayment)));

  const store = createStore({ auth: { user, isInitialized: true } });
  return render(
    <MemoryRouter initialEntries={['/billing/payments/payment-1']}>
      <Provider store={store}>
        <PageHeaderProvider>
          <Routes>
            <Route path="/billing/payments/:id" element={<PaymentDetailPage />} />
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
  permissions: ['payment.view', 'payment.reverse'],
  buildingIds: [],
  buildingPermissions: [],
};

describe('PaymentDetailPage', () => {
  it('shows the allocation breakdown from the server', async () => {
    renderDetailPage(adminUser, payment());

    expect(await screen.findByRole('heading', { name: 'RCPT-001' })).toBeInTheDocument();
    expect(screen.getByText('INV-A-2026-000001')).toBeInTheDocument();
  }, 15000);

  it('reverses a payment with a strong confirmation and sends an idempotency key', async () => {
    let receivedKey: string | null = null;
    let receivedBody: unknown = null;

    renderDetailPage(adminUser, payment());
    server.use(
      http.post(`${API_BASE}/api/v1/payments/payment-1/reverse`, async ({ request }) => {
        receivedKey = request.headers.get('X-Idempotency-Key');
        receivedBody = await request.json();
        return HttpResponse.json(payment({ status: 'Reversed', reversalReason: 'Bounced cheque' }));
      }),
    );

    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'RCPT-001' });

    await user.click(screen.getByRole('button', { name: /reverse/i }));
    // Consequence + identity are shown before confirming.
    expect(screen.getByText(/restored to its prior outstanding balance/i)).toBeInTheDocument();
    expect(screen.getAllByText('RCPT-001').length).toBeGreaterThan(0);

    await user.type(screen.getByLabelText('Reason'), 'Bounced cheque');
    await user.click(screen.getByRole('button', { name: /^reverse payment$/i }));

    await waitFor(() => expect(receivedBody).toEqual({ reason: 'Bounced cheque' }));
    expect(receivedKey).not.toBeNull();
  }, 15000);

  it('does not show Reverse for an already-reversed payment', async () => {
    renderDetailPage(adminUser, payment({ status: 'Reversed', reversalReason: 'Duplicate' }));

    await screen.findByRole('heading', { name: 'RCPT-001' });
    expect(screen.queryByRole('button', { name: /^reverse$/i })).not.toBeInTheDocument();
  }, 15000);
});
