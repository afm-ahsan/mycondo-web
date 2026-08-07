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
import { useRequestCorrection } from '../api/staffAttendanceApi';
import type { AttendanceRegisterEntryDto } from '@/api/generated/mycondoApi';

interface RequestCorrectionDialogProps {
  record: AttendanceRegisterEntryDto | null;
  onOpenChange: (open: boolean) => void;
}

export function RequestCorrectionDialog({ record, onOpenChange }: RequestCorrectionDialogProps) {
  const [requestCorrection, { isLoading }] = useRequestCorrection();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!record) return;
    setError(null);
    try {
      await requestCorrection({
        id: record.attendanceRecordId,
        requestCorrectionRequest: { reason },
      }).unwrap();
      toast.success('Correction requested.');
      setReason('');
      onOpenChange(false);
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  return (
    <Dialog
      open={record !== null}
      onOpenChange={(open) => {
        if (!open) {
          setReason('');
          setError(null);
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-md">
        {record && (
          <>
            <DialogHeader>
              <DialogTitle>Request Correction — {record.staffMemberFullName}</DialogTitle>
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
                <Label htmlFor="correction-reason">Reason</Label>
                <Textarea
                  id="correction-reason"
                  placeholder="Describe what needs to be corrected on this attendance record…"
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
              <Button onClick={handleSubmit} disabled={isLoading || reason.trim().length === 0}>
                {isLoading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
