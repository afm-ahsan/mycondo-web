import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { ResidentLedgerPage } from './ResidentLedgerPage';

const API_BASE = 'https://localhost:7219';

const viewUser: AuthUser = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Billing Admin',
  tenantId: 'tenant-1',
  roles: ['BillingAdmin'],
  permissions: ['payment.view', 'residentaccount.view'],
  buildingIds: [],
  buildingPermissions: [],
};

describe('ResidentLedgerPage', () => {
  it('shows the authoritative current balance separately and the ledger entries with a resolved reference-type source label', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/residents`, () =>
        HttpResponse.json({
          items: [{ residentId: 'res-1', flatId: 'flat-1', fullName: 'Karim Ahmed', phone: '01711000000' }],
          page: 1,
          pageSize: 20,
          total: 1,
        }),
      ),
      http.get(`${API_BASE}/api/v1/resident-accounts/flat-1/balance`, () =>
        HttpResponse.json({ flatId: 'flat-1', balance: -500 }),
      ),
      http.get(`${API_BASE}/api/v1/resident-accounts/flat-1/ledger-entries`, () => {
        return HttpResponse.json({
          items: [
            {
              ledgerEntryId: 'entry-1',
              postingId: 'posting-1',
              accountType: 'ResidentReceivable',
              flatId: 'flat-1',
              direction: 'Debit',
              amount: 2500,
              businessDate: '2026-08-01',
              description: 'Service charge invoice INV-A-2026-000001 for flat flat-1',
              createdAtUtc: '2026-08-01T00:00:00Z',
              referenceType: 'Invoice',
              referenceId: null,
            },
          ],
          page: 1,
          pageSize: 20,
          total: 1,
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ResidentLedgerPage />, { auth: { user: viewUser, isInitialized: true } });

    const residentTrigger = screen.getByText(/search by resident name or mobile/i).closest('[role="combobox"]') as HTMLElement;
    await user.click(residentTrigger);
    await user.type(screen.getByPlaceholderText(/search by name or mobile/i), 'Karim');
    await user.click(await screen.findByText(/Karim Ahmed/));

    // Authoritative balance shown as its own field, distinct from the entries table.
    expect(await screen.findByText('Current balance (authoritative, server-computed)')).toBeInTheDocument();

    // Entry rendered with a resolved source label (from referenceType) and both Debit/Credit columns —
    // no running-balance column exists anywhere on this page.
    expect(await screen.findByText('Invoice issued')).toBeInTheDocument();
    expect(screen.queryByText(/running balance/i)).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('Ledger Entries')).toBeInTheDocument());
  }, 15000);
});
