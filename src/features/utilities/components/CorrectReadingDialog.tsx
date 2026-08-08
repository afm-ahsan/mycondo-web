import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import { useCorrectReadingIdempotentMutation } from '@/api/idempotentEndpoints';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useIdempotencyKey } from '@/lib/idempotency/useIdempotencyKey';
import type { ReadingDto } from '@/api/generated/mycondoApi';

interface CorrectReadingDialogProps {
  reading: ReadingDto | null;
  onOpenChange: (open: boolean) => void;
  onCorrected: () => void;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * High-consequence: correcting a `Billed` reading voids its invoice inline server-side (reversing
 * ledger posting) and always creates a brand-new Draft reading — it does NOT edit the historical
 * record in place. The dialog states this plainly rather than implying an in-place fix, per the
 * UX-3 spec.
 */
export function CorrectReadingDialog({ reading, onOpenChange, onCorrected }: CorrectReadingDialogProps) {
  const [correctReading, { isLoading }] = useCorrectReadingIdempotentMutation();
  const [idempotencyKey, resetIdempotencyKey] = useIdempotencyKey();
  const [previousReading, setPreviousReading] = useState('0');
  const [presentReading, setPresentReading] = useState('0');
  const [readingDate, setReadingDate] = useState(today());
  const [overrideReason, setOverrideReason] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(open: boolean) {
    if (!open) {
      resetIdempotencyKey();
      setPreviousReading('0');
      setPresentReading('0');
      setReadingDate(today());
      setOverrideReason('');
      setReason('');
      setError(null);
    }
    onOpenChange(open);
  }

  async function handleSubmit() {
    if (!reading) return;
    setError(null);
    try {
      await correctReading({
        id: reading.readingId,
        correctReadingRequest: {
          previousReading: Number(previousReading),
          presentReading: Number(presentReading),
          readingDate,
          overrideReason: overrideReason || null,
          reason,
        },
        idempotencyKey,
      }).unwrap();
      toast.success('Correction recorded — a new Draft reading was created.');
      onCorrected();
      handleOpenChange(false);
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  return (
    <Dialog open={reading !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        {reading && (
          <>
            <DialogHeader>
              <DialogTitle>Correct This Reading?</DialogTitle>
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
              <Alert variant="warning" appearance="light">
                <AlertIcon>
                  <AlertCircle />
                </AlertIcon>
                <AlertTitle>
                  {reading.status === 'Billed'
                    ? 'This reading is Billed — correcting it will void the associated invoice and post a reversing ledger entry.'
                    : 'This reading will be marked Corrected.'}{' '}
                  A brand-new Draft reading will be created — this does not edit the existing record in place; the
                  new reading must independently go through Review → Finalize → Bill.
                </AlertTitle>
              </Alert>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="correct-previous">Previous reading</Label>
                  <Input id="correct-previous" type="number" min={0} step="0.01" value={previousReading} onChange={(e) => setPreviousReading(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="correct-present">Present reading</Label>
                  <Input id="correct-present" type="number" min={0} step="0.01" value={presentReading} onChange={(e) => setPresentReading(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="correct-date">Reading date</Label>
                <Input id="correct-date" type="date" value={readingDate} onChange={(e) => setReadingDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="correct-override">Override reason (optional, only if continuity is flagged)</Label>
                <Input id="correct-override" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="correct-reason">Reason for correction</Label>
                <Textarea id="correct-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleSubmit} disabled={isLoading || reason.trim().length === 0}>
                {isLoading ? 'Correcting...' : 'Correct Reading'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
