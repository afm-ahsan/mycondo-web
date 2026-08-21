import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { FinanceAuditLogPage } from './FinanceAuditLogPage';

const API_BASE = 'https://localhost:7219';

const user: AuthUser = {
  id: 'user-1',
  email: 'auditor@example.com',
  name: 'Auditor',
  tenantId: 'tenant-1',
  roles: ['Auditor'],
  permissions: ['audit.view'],
  buildingIds: [],
  buildingPermissions: [],
};

describe('FinanceAuditLogPage', () => {
  it('renders recent sensitive Finance actions', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/finance/audit-log`, () =>
        HttpResponse.json([
          {
            financeAuditLogEntryId: 'entry-1',
            occurredAtUtc: '2026-08-21T10:00:00Z',
            actorUserId: 'user-2',
            action: 'AccountingPeriod.Close',
            targetType: 'AccountingPeriod',
            targetId: 'period-1',
            metadata: null,
            correlationId: null,
          },
          {
            financeAuditLogEntryId: 'entry-2',
            occurredAtUtc: '2026-08-20T09:00:00Z',
            actorUserId: 'user-2',
            action: 'Payment.Reverse',
            targetType: 'Payment',
            targetId: 'payment-1',
            metadata: '{"reason":"duplicate entry"}',
            correlationId: null,
          },
        ]),
      ),
    );
    renderWithProviders(<FinanceAuditLogPage />, { auth: { user, isInitialized: true } });

    expect(await screen.findByText('AccountingPeriod.Close')).toBeInTheDocument();
    expect(screen.getByText('Payment.Reverse')).toBeInTheDocument();
  });

  it('shows an empty state when there is no activity yet', async () => {
    server.use(http.get(`${API_BASE}/api/v1/finance/audit-log`, () => HttpResponse.json([])));
    renderWithProviders(<FinanceAuditLogPage />, { auth: { user, isInitialized: true } });

    expect(await screen.findByText('No activity yet')).toBeInTheDocument();
  });
});
