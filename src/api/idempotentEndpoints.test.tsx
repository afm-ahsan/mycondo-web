import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { useIdempotencyKey } from '@/lib/idempotency/useIdempotencyKey';
import { useRecordPaymentIdempotentMutation } from './idempotentEndpoints';
import type { RecordPaymentCommand } from './generated/mycondoApi';

const API_BASE = 'https://localhost:7219';

const command: RecordPaymentCommand = {
  flatId: 'flat-1',
  amount: 5000,
  paymentMethod: 'Cash',
  referenceNumber: null,
  businessDate: '2026-08-08',
  description: null,
};

/** Minimal harness mirroring how a real "Record Payment" dialog would pair the two hooks: one key
 * per mount, a Submit button that reuses it (retry), and a Reset+Submit button that gets a fresh one
 * (a new distinct command). */
function Harness() {
  const [idempotencyKey, resetKey] = useIdempotencyKey();
  const [recordPayment] = useRecordPaymentIdempotentMutation();

  return (
    <div>
      <button onClick={() => recordPayment({ recordPaymentCommand: command, idempotencyKey })}>Submit</button>
      <button
        onClick={() => {
          resetKey();
        }}
      >
        Reset
      </button>
    </div>
  );
}

describe('idempotentEndpoints', () => {
  it('sends the same idempotency key header on a retry of the same command', async () => {
    const receivedKeys: (string | null)[] = [];
    server.use(
      http.post(`${API_BASE}/api/v1/payments`, ({ request }) => {
        receivedKeys.push(request.headers.get('X-Idempotency-Key'));
        return HttpResponse.json({
          paymentId: 'payment-1',
          flatId: 'flat-1',
          amount: 5000,
          paymentMethod: 'Cash',
          referenceNumber: null,
          businessDate: '2026-08-08',
          receivedBy: null,
          status: 'Posted',
          ledgerPostingId: 'posting-1',
          reversedAtUtc: null,
          reversedBy: null,
          reversalReason: null,
          allocations: [],
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(receivedKeys).toHaveLength(1));

    // Retry the same still-open "dialog" — no reset — must reuse the same key.
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(receivedKeys).toHaveLength(2));

    expect(receivedKeys[0]).not.toBeNull();
    expect(receivedKeys[1]).toBe(receivedKeys[0]);
  }, 15000);

  it('sends a different idempotency key after reset, for a new distinct command', async () => {
    const receivedKeys: (string | null)[] = [];
    server.use(
      http.post(`${API_BASE}/api/v1/payments`, ({ request }) => {
        receivedKeys.push(request.headers.get('X-Idempotency-Key'));
        return HttpResponse.json({
          paymentId: 'payment-1',
          flatId: 'flat-1',
          amount: 5000,
          paymentMethod: 'Cash',
          referenceNumber: null,
          businessDate: '2026-08-08',
          receivedBy: null,
          status: 'Posted',
          ledgerPostingId: 'posting-1',
          reversedAtUtc: null,
          reversedBy: null,
          reversalReason: null,
          allocations: [],
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(receivedKeys).toHaveLength(1));

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(receivedKeys).toHaveLength(2));

    expect(receivedKeys[1]).not.toBe(receivedKeys[0]);
  }, 15000);

  it('retains the same key when the same command is retried after a failed request', async () => {
    const receivedKeys: (string | null)[] = [];
    let callCount = 0;
    server.use(
      http.post(`${API_BASE}/api/v1/payments`, ({ request }) => {
        callCount += 1;
        receivedKeys.push(request.headers.get('X-Idempotency-Key'));
        if (callCount === 1) {
          return HttpResponse.json({ status: 500, title: 'Transient failure' }, { status: 500 });
        }
        return HttpResponse.json({
          paymentId: 'payment-1',
          flatId: 'flat-1',
          amount: 5000,
          paymentMethod: 'Cash',
          referenceNumber: null,
          businessDate: '2026-08-08',
          receivedBy: null,
          status: 'Posted',
          ledgerPostingId: 'posting-1',
          reversedAtUtc: null,
          reversedBy: null,
          reversalReason: null,
          allocations: [],
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    // First attempt fails — the harness never calls Reset on failure (matching the rule: a dialog
    // only resets the key on success or on abandon/close, never merely because a request failed).
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(receivedKeys).toHaveLength(1));

    // Retry the same logical command without resetting — must reuse the same key.
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(receivedKeys).toHaveLength(2));

    expect(receivedKeys[0]).not.toBeNull();
    expect(receivedKeys[1]).toBe(receivedKeys[0]);
  }, 15000);
});
