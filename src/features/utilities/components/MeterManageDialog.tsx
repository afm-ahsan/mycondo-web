import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/ui/status-badge';
import { FlatSelect } from '@/components/shared/FlatSelect';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import {
  useAssignMeter,
  useMarkMeterFaulty,
  useMeterAssignmentHistory,
  useReactivateMeter,
  useReplaceMeter,
} from '../api/metersApi';
import { meterStatusToneMap, type MeterStatus } from '../lib/meterStatus';
import type { MeterDto } from '@/api/generated/mycondoApi';

interface MeterManageDialogProps {
  meter: MeterDto | null;
  buildingId: string;
  onOpenChange: (open: boolean) => void;
}

export function MeterManageDialog({ meter, buildingId, onOpenChange }: MeterManageDialogProps) {
  return (
    <Dialog open={meter !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        {meter && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {meter.meterNumber}
                <StatusBadge status={meter.status as MeterStatus} toneMap={meterStatusToneMap} />
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <StatusActionsSection meter={meter} />
              <Separator />
              <AssignmentSection meter={meter} buildingId={buildingId} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatusActionsSection({ meter }: { meter: MeterDto }) {
  const [markFaulty, { isLoading: isMarkingFaulty }] = useMarkMeterFaulty();
  const [reactivate, { isLoading: isReactivating }] = useReactivateMeter();
  const [replaceMeter, { isLoading: isReplacing }] = useReplaceMeter();
  const [faultReason, setFaultReason] = useState('');
  const [newMeterNumber, setNewMeterNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleMarkFaulty() {
    setError(null);
    try {
      await markFaulty({ id: meter.meterId, markMeterFaultyRequest: { reason: faultReason } }).unwrap();
      toast.success(`${meter.meterNumber} marked faulty.`);
      setFaultReason('');
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  async function handleReactivate() {
    setError(null);
    try {
      await reactivate({ id: meter.meterId }).unwrap();
      toast.success(`${meter.meterNumber} reactivated.`);
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  async function handleReplace() {
    setError(null);
    try {
      await replaceMeter({ id: meter.meterId, replaceMeterRequest: { newMeterNumber } }).unwrap();
      toast.success(`${meter.meterNumber} replaced with ${newMeterNumber}.`);
      setNewMeterNumber('');
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  return (
    <RequirePermission permission={PERMISSIONS.utility.meterManage}>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Status</h3>
        {error && (
          <Alert variant="destructive" appearance="light" onClose={() => setError(null)}>
            <AlertIcon>
              <AlertCircle />
            </AlertIcon>
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        {meter.status === 'Active' && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              aria-label="Reason for marking faulty"
              placeholder="Reason for marking faulty"
              value={faultReason}
              onChange={(e) => setFaultReason(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="destructive"
              onClick={handleMarkFaulty}
              disabled={isMarkingFaulty || faultReason.trim().length === 0}
            >
              {isMarkingFaulty ? 'Saving...' : 'Mark Faulty'}
            </Button>
          </div>
        )}

        {(meter.status === 'Faulty' || meter.status === 'Inactive') && (
          <Button variant="outline" onClick={handleReactivate} disabled={isReactivating}>
            {isReactivating ? 'Reactivating...' : 'Reactivate'}
          </Button>
        )}

        {meter.status !== 'Replaced' && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              aria-label="New meter number"
              placeholder="New meter number"
              value={newMeterNumber}
              onChange={(e) => setNewMeterNumber(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={handleReplace}
              disabled={isReplacing || newMeterNumber.trim().length === 0}
            >
              {isReplacing ? 'Replacing...' : 'Replace Meter'}
            </Button>
          </div>
        )}
      </div>
    </RequirePermission>
  );
}

function AssignmentSection({ meter, buildingId }: { meter: MeterDto; buildingId: string }) {
  const { data: history, isLoading } = useMeterAssignmentHistory({ id: meter.meterId });
  const [assignMeter, { isLoading: isAssigning }] = useAssignMeter();
  const [flatId, setFlatId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const currentAssignment = history?.find((a) => !a.assignedToUtc);

  async function handleAssign() {
    if (!flatId) return;
    setError(null);
    try {
      await assignMeter({ id: meter.meterId, assignMeterRequest: { flatId } }).unwrap();
      toast.success('Meter assigned.');
      setFlatId('');
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Flat Assignment</h3>
      {error && (
        <Alert variant="destructive" appearance="light" onClose={() => setError(null)}>
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading assignment history…</p>
      ) : currentAssignment ? (
        <p className="text-sm">
          Currently assigned to flat <span className="font-mono text-xs">{currentAssignment.flatId}</span> since{' '}
          {new Date(currentAssignment.assignedFromUtc).toLocaleDateString()}.
        </p>
      ) : (
        <p className="text-muted-foreground text-sm">Not currently assigned to a flat.</p>
      )}

      <RequirePermission permission={PERMISSIONS.utility.meterManage}>
        <div className="space-y-1.5">
          <Label>Assign to flat</Label>
          <div className="flex gap-2">
            <FlatSelect buildingId={buildingId} value={flatId} onValueChange={setFlatId} />
            <Button onClick={handleAssign} disabled={isAssigning || !flatId}>
              {isAssigning ? 'Assigning...' : 'Assign'}
            </Button>
          </div>
        </div>
      </RequirePermission>

      {history && history.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1 pt-2">
          {history.map((a) => (
            <li key={a.meterAssignmentId}>
              Flat {a.flatId}: {new Date(a.assignedFromUtc).toLocaleDateString()} –{' '}
              {a.assignedToUtc ? new Date(a.assignedToUtc).toLocaleDateString() : 'ongoing'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
