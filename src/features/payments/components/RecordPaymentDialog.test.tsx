import { useState } from 'react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { RecordPaymentDialog } from './RecordPaymentDialog';

const API_BASE = 'https://localhost:7219';

const frontDeskUser: AuthUser = {
  id: 'user-1',
  email: 'frontdesk@example.com',
  name: 'Front Desk',
  tenantId: 'tenant-1',
  roles: ['FrontDesk'],
  permissions: ['payment.record'],
  buildingIds: [],
  buildingPermissions: [],
};

async function chooseOption(user: ReturnType<typeof userEvent.setup>, placeholder: string, optionName: string) {
  const placeholderNode = await screen.findByText(placeholder);
  const trigger = placeholderNode.closest('[role="combobox"]') as HTMLElement;
  await user.click(trigger);
  await user.click(await screen.findByRole('option', { name: optionName }));
}

function ControlledRecordPaymentDialog() {
  const [open, setOpen] = useState(true);
  return <RecordPaymentDialog open={open} onOpenChange={setOpen} />;
}

describe('RecordPaymentDialog', () => {
  it('records a payment, sends an idempotency key, and closes the dialog on success', async () => {
    let receivedKey: string | null = null;
    let receivedBody: unknown = null;

    server.use(
      http.get(`${API_BASE}/api/v1/residents`, () =>
        HttpResponse.json({
          items: [{ residentId: 'res-1', flatId: 'flat-1', fullName: 'Karim Ahmed', phone: '01711000000' }],
          page: 1,
          pageSize: 20,
          total: 1,
        }),
      ),
      http.post(`${API_BASE}/api/v1/payments`, async ({ request }) => {
        receivedKey = request.headers.get('X-Idempotency-Key');
        receivedBody = await request.json();
        return HttpResponse.json({
          paymentId: 'payment-1',
          flatId: 'flat-1',
          amount: 3000,
          paymentMethod: 'Cash',
          referenceNumber: null,
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
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ControlledRecordPaymentDialog />, { auth: { user: frontDeskUser, isInitialized: true } });

    await screen.findByRole('dialog');
    const residentTrigger = screen.getByText(/search by resident name or mobile/i).closest('[role="combobox"]') as HTMLElement;
    await user.click(residentTrigger);
    await user.type(screen.getByPlaceholderText(/search by name or mobile/i), 'Karim');
    await user.click(await screen.findByText(/Karim Ahmed/));

    await user.clear(screen.getByLabelText('Amount (BDT)'));
    await user.type(screen.getByLabelText('Amount (BDT)'), '3000');
    await chooseOption(user, 'Select method', 'Cash');
    await user.click(screen.getByRole('button', { name: /record payment/i }));

    await waitFor(() => expect(receivedBody).not.toBeNull());
    expect(receivedBody).toMatchObject({ flatId: 'flat-1', amount: 3000, paymentMethod: 'Cash' });
    expect(receivedKey).not.toBeNull();

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  }, 15000);
});
