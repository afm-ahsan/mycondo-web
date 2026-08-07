import { useState } from 'react';
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

interface ReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmVariant?: 'default' | 'destructive';
  isSubmitting?: boolean;
  onConfirm: (reason: string) => void;
}

/** Generic "confirm with required text" dialog, mirrors amenities/components/OverrideReasonDialog.tsx
 * exactly — reused here for reject/adjustment/breakdown-resolution reasons. */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmVariant = 'default',
  isSubmitting,
  onConfirm,
}: ReasonDialogProps) {
  const [reason, setReason] = useState('');

  function handleOpenChange(next: boolean) {
    if (!next) setReason('');
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
          <Label htmlFor="reason-dialog-text">Reason</Label>
          <Textarea
            id="reason-dialog-text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            disabled={isSubmitting || reason.trim().length === 0}
            onClick={() => onConfirm(reason.trim())}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
