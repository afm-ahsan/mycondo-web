import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import { useReversePaymentIdempotentMutation } from '@/api/idempotentEndpoints';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { useIdempotencyKey } from '@/lib/idempotency/useIdempotencyKey';
import type { PaymentDto } from '@/api/generated/mycondoApi';

interface ReversePaymentDialogProps {
  payment: PaymentDto | null;
  onOpenChange: (open: boolean) => void;
  onReversed: (payment: PaymentDto) => void;
}

/**
 * High-consequence confirmation: shows payment reference/identity, amount, status, and the
 * consequence plainly, per the UX-3 spec. Restoring the affected invoices' balances happens
 * server-side (ReversePaymentCommandHandler) — this dialog never touches invoice math itself.
 */
export function ReversePaymentDialog({ payment, onOpenChange, onReversed }: ReversePaymentDialogProps) {
  const [reversePayment, { isLoading }] = useReversePaymentIdempotentMutation();
  const [idempotencyKey, resetIdempotencyKey] = useIdempotencyKey();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(open: boolean) {
    if (!open) {
      resetIdempotencyKey();
      setReason('');
      setError(null);
    }
    onOpenChange(open);
  }

  async function handleSubmit() {
    if (!payment) return;
    setError(null);
    try {
      const reversed = await reversePayment({
        id: payment.paymentId,
        reversePaymentRequest: { reason },
        idempotencyKey,
      }).unwrap();
      toast.success('Payment reversed.');
      onReversed(reversed);
      handleOpenChange(false);
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  return (
    <Dialog open={payment !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        {payment && (
          <>
            <DialogHeader>
              <DialogTitle>Reverse This Payment?</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive" appearance="light" onClose={() => setError(null)}>
                  <AlertIcon>
                    <AlertCircle />
                  </AlertIcon>
                  <AlertTitle>{error}</AlertTitle>
                </Alert>
              )}
              <div className="rounded-md border border-border p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-medium">{payment.referenceNumber ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Flat</span>
                  <span className="font-mono text-xs">{payment.flatId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <MoneyDisplay amount={payment.amount} className="font-medium" />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium">{payment.status}</span>
                </div>
              </div>
              <Alert variant="destructive" appearance="light">
                <AlertIcon>
                  <AlertCircle />
                </AlertIcon>
                <AlertTitle>
                  Every invoice this payment was allocated against will be restored to its prior outstanding balance.
                  This cannot be undone.
                </AlertTitle>
              </Alert>
              <div className="space-y-1.5">
                <Label htmlFor="reverse-reason">Reason</Label>
                <Textarea
                  id="reverse-reason"
                  placeholder="Explain why this payment is being reversed…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleSubmit}
                disabled={isLoading || reason.trim().length === 0}
              >
                {isLoading ? 'Reversing...' : 'Reverse Payment'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
