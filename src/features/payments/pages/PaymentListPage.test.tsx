import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { PaymentListPage } from './PaymentListPage';

const API_BASE = 'https://localhost:7219';

const viewUser: AuthUser = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Billing Admin',
  tenantId: 'tenant-1',
  roles: ['BillingAdmin'],
  permissions: ['payment.view'],
  buildingIds: [],
  buildingPermissions: [],
};

describe('PaymentListPage', () => {
  it('renders payment rows with server-provided status', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/payments`, () =>
        HttpResponse.json({
          items: [
            {
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
              allocations: [],
            },
          ],
          page: 1,
          pageSize: 10,
          total: 1,
        }),
      ),
    );

    renderWithProviders(<PaymentListPage />, { auth: { user: viewUser, isInitialized: true } });

    expect(await screen.findByText('RCPT-001')).toBeInTheDocument();
    expect(screen.getByText('Posted')).toBeInTheDocument();
  }, 15000);
});
