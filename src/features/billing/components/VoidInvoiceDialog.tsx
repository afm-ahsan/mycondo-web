import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
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
import { useVoidInvoiceIdempotentMutation } from '@/api/idempotentEndpoints';
import { useIdempotencyKey } from '@/lib/idempotency/useIdempotencyKey';
import type { InvoiceDto } from '@/api/generated/mycondoApi';

interface VoidInvoiceDialogProps {
  invoice: InvoiceDto | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * High-consequence confirmation, per the UX-3 spec — shows invoice number, flat, amount, requires a
 * reason, and states the consequence plainly. Only ever reachable for a fully-unpaid invoice (the
 * caller gates the trigger on `amountPaid === 0`); the backend re-enforces this regardless.
 */
export function VoidInvoiceDialog({ invoice, onOpenChange }: VoidInvoiceDialogProps) {
  const [voidInvoice, { isLoading }] = useVoidInvoiceIdempotentMutation();
  const [idempotencyKey, resetIdempotencyKey] = useIdempotencyKey();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(open: boolean) {
    if (!open) {
      // Closing for any reason (success or abandon/cancel) means the next open is a genuinely new
      // command — get a fresh key. A failed submit that keeps the dialog open never reaches here.
      resetIdempotencyKey();
      setReason('');
      setError(null);
    }
    onOpenChange(open);
  }

  async function handleSubmit() {
    if (!invoice) return;
    setError(null);
    try {
      await voidInvoice({ id: invoice.invoiceId, voidInvoiceRequest: { reason }, idempotencyKey }).unwrap();
      toast.success(`Invoice ${invoice.invoiceNumber} voided.`);
      handleOpenChange(false);
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  return (
    <Dialog open={invoice !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        {invoice && (
          <>
            <DialogHeader>
              <DialogTitle>Void Invoice {invoice.invoiceNumber}?</DialogTitle>
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
                  <span className="text-muted-foreground">Flat</span>
                  <span className="font-mono text-xs">{invoice.flatId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <MoneyDisplay amount={invoice.totalAmount} className="font-medium" />
                </div>
              </div>
              <Alert variant="destructive" appearance="light">
                <AlertIcon>
                  <AlertCircle />
                </AlertIcon>
                <AlertTitle>
                  This posts a reversing ledger entry and permanently marks the invoice Void. This cannot be undone.
                </AlertTitle>
              </Alert>
              <div className="space-y-1.5">
                <Label htmlFor="void-reason">Reason</Label>
                <Textarea
                  id="void-reason"
                  placeholder="Explain why this invoice is being voided…"
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
                {isLoading ? 'Voiding...' : 'Void Invoice'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
