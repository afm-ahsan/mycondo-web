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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClockIn } from '../api/staffAttendanceApi';
import { ATTENDANCE_SOURCES } from '../lib/constants';
import type { StaffMemberDto } from '@/api/generated/mycondoApi';

interface ClockInDialogProps {
  staffMember: StaffMemberDto | null;
  onOpenChange: (open: boolean) => void;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ClockInDialog({ staffMember, onOpenChange }: ClockInDialogProps) {
  const [clockIn, { isLoading }] = useClockIn();
  const [workDate, setWorkDate] = useState(today());
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [source, setSource] = useState<string>('Manual');
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setWorkDate(today());
    setScheduledStart('');
    setScheduledEnd('');
    setWorkLocation('');
    setSource('Manual');
    setError(null);
  }

  async function handleSubmit() {
    if (!staffMember) return;
    setError(null);
    try {
      await clockIn({
        id: staffMember.staffMemberId,
        clockInRequest: {
          workDate,
          scheduledStartUtc: scheduledStart ? new Date(scheduledStart).toISOString() : null,
          scheduledEndUtc: scheduledEnd ? new Date(scheduledEnd).toISOString() : null,
          workLocation: workLocation || null,
          source,
        },
      }).unwrap();
      toast.success(`${staffMember.fullName} clocked in.`);
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  return (
    <Dialog
      open={staffMember !== null}
      onOpenChange={(open) => {
        if (!open) reset();
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-md">
        {staffMember && (
          <>
            <DialogHeader>
              <DialogTitle>Clock In — {staffMember.fullName}</DialogTitle>
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
                <Label>Work date</Label>
                <Input type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Scheduled start (optional)</Label>
                  <Input type="datetime-local" value={scheduledStart} onChange={(e) => setScheduledStart(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Scheduled end (optional)</Label>
                  <Input type="datetime-local" value={scheduledEnd} onChange={(e) => setScheduledEnd(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Work location (optional)</Label>
                <Input
                  placeholder="e.g. Main Gate, Block B"
                  value={workLocation}
                  onChange={(e) => setWorkLocation(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ATTENDANCE_SOURCES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading || !workDate}>
                {isLoading ? 'Clocking in...' : 'Clock In'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
