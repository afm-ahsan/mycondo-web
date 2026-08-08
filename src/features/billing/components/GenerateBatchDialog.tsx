import { AlertCircle } from 'lucide-react';
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
import { useGenerateInvoiceBatchIdempotentMutation } from '@/api/idempotentEndpoints';
import { useIdempotencyKey } from '@/lib/idempotency/useIdempotencyKey';
import { formatBillingPeriod } from '../lib/billingPeriod';
import type { GenerateInvoiceBatchResultDto } from '@/api/generated/mycondoApi';

interface GenerateBatchDialogProps {
  open: boolean;
  buildingLabel: string;
  buildingId: string;
  periodStart: string;
  periodEnd: string;
  onOpenChange: (open: boolean) => void;
  onResult: (result: GenerateInvoiceBatchResultDto) => void;
}

/**
 * Confirmation for a financially consequential batch run — states building, period, and the
 * consequence plainly before firing. Idempotency key resets whenever the dialog closes (success or
 * cancel), never merely because a request failed — see useIdempotencyKey's contract.
 */
export function GenerateBatchDialog({
  open,
  buildingLabel,
  buildingId,
  periodStart,
  periodEnd,
  onOpenChange,
  onResult,
}: GenerateBatchDialogProps) {
  const [generateBatch, { isLoading, error }] = useGenerateInvoiceBatchIdempotentMutation();
  const [idempotencyKey, resetIdempotencyKey] = useIdempotencyKey();

  function handleOpenChange(next: boolean) {
    if (!next) {
      resetIdempotencyKey();
    }
    onOpenChange(next);
  }

  async function handleConfirm() {
    try {
      const result = await generateBatch({
        generateInvoiceBatchCommand: { buildingId, periodStart, periodEnd },
        idempotencyKey,
      }).unwrap();
      onResult(result);
      handleOpenChange(false);
    } catch {
      // error state is already surfaced via the `error` field below; dialog stays open for retry
      // with the same key.
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate invoices for this period?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive" appearance="light">
              <AlertIcon>
                <AlertCircle />
              </AlertIcon>
              <AlertTitle>{toUserMessage(error)}</AlertTitle>
            </Alert>
          )}
          <div className="rounded-md border border-border p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Building</span>
              <span className="font-medium">{buildingLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Period</span>
              <span className="font-medium">{formatBillingPeriod(periodStart, periodEnd)}</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            One invoice will be issued per eligible flat that doesn&rsquo;t already have one for this exact period.
            Flats already invoiced for this period are skipped automatically — this is safe to re-run.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Invoices'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
