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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAppSelector } from '@/store/hooks';
import { hasPermission } from '@/lib/auth/permissions';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { useCloseParcel } from '../api/parcelsApi';
import { CLOSE_PARCEL_OUTCOMES } from '../lib/constants';

interface CloseParcelDialogProps {
  parcelId: string | null;
  onOpenChange: (open: boolean) => void;
}

const outcomeLabels: Record<(typeof CLOSE_PARCEL_OUTCOMES)[number], string> = {
  Returned: 'Returned to courier/sender',
  Rejected: 'Rejected by recipient',
  LostOrEscalated: 'Lost / escalate for follow-up',
};

// CloseParcelCommandHandler additionally requires parcel.escalate when Outcome is LostOrEscalated,
// on top of the endpoint's own parcel.return filter — see permissionKeys.ts's parcel.escalate comment.
export function CloseParcelDialog({ parcelId, onOpenChange }: CloseParcelDialogProps) {
  const [closeParcel, { isLoading }] = useCloseParcel();
  const [outcome, setOutcome] = useState<string>('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const canEscalate = useAppSelector((s) => hasPermission(s.auth.user, PERMISSIONS.parcel.escalate));

  function reset() {
    setOutcome('');
    setReason('');
    setError(null);
  }

  async function handleSubmit() {
    if (!parcelId || !outcome) return;
    setError(null);
    try {
      await closeParcel({ id: parcelId, closeParcelRequest: { outcome, reason } }).unwrap();
      toast.success('Parcel closed.');
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  return (
    <Dialog
      open={parcelId !== null}
      onOpenChange={(open) => {
        if (!open) reset();
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Close Parcel</DialogTitle>
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
          <div className="space-y-1.5">
            <Label>Outcome</Label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select outcome" />
              </SelectTrigger>
              <SelectContent>
                {CLOSE_PARCEL_OUTCOMES.map((o) => (
                  <SelectItem key={o} value={o} disabled={o === 'LostOrEscalated' && !canEscalate}>
                    {outcomeLabels[o]}
                    {o === 'LostOrEscalated' && !canEscalate ? ' (requires parcel.escalate)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="close-reason">Reason</Label>
            <Textarea
              id="close-reason"
              placeholder="Explain why this parcel is being closed…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !outcome || reason.trim().length === 0}>
            {isLoading ? 'Saving...' : 'Close Parcel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
