import { useState } from 'react';
import { AlertCircle, Check, Plus, X } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { StatusBadge, type StatusBadgeMap } from '@/components/ui/status-badge';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { FlatSelect } from '@/components/shared/FlatSelect';
import { InlineSpinner } from '@/components/feedback/InlineSpinner';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import {
  useApproveWorkerAssignment,
  useCreateWorkerAssignment,
  useDeactivateWorkerAssignment,
  useSetWorkerStatus,
  useWorkerAssignments,
} from '../api/domesticWorkersApi';
import { isAssignmentExpired } from '../lib/assignmentStatus';
import { WORKER_STATUSES } from '../lib/constants';
import type { DomesticWorkerProfileDto } from '@/api/generated/mycondoApi';

const statusToneMap: StatusBadgeMap<'Active' | 'Suspended' | 'Blocked'> = {
  Active: { label: 'Active', variant: 'success' },
  Suspended: { label: 'Suspended', variant: 'warning' },
  Blocked: { label: 'Blocked', variant: 'destructive' },
};

interface WorkerManageDialogProps {
  worker: DomesticWorkerProfileDto | null;
  onOpenChange: (open: boolean) => void;
}

export function WorkerManageDialog({ worker, onOpenChange }: WorkerManageDialogProps) {
  return (
    <Dialog open={worker !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {worker && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {worker.fullName}
                <StatusBadge status={worker.status as 'Active' | 'Suspended' | 'Blocked'} toneMap={statusToneMap} />
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <StatusSection worker={worker} />
              <Separator />
              <AssignmentsSection worker={worker} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatusSection({ worker }: { worker: DomesticWorkerProfileDto }) {
  const [setStatus, { isLoading }] = useSetWorkerStatus();
  const [nextStatus, setNextStatus] = useState<string>('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    try {
      await setStatus({
        id: worker.domesticWorkerProfileId,
        setDomesticWorkerStatusRequest: { status: nextStatus, reason: reason || null },
      }).unwrap();
      toast.success(`Status updated to ${nextStatus}.`);
      setNextStatus('');
      setReason('');
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  return (
    <RequirePermission permission={PERMISSIONS.domesticWorker.manage}>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Status</h3>
        {worker.statusReason && (
          <p className="text-muted-foreground text-sm">Current reason: {worker.statusReason}</p>
        )}
        {error && (
          <Alert variant="destructive" appearance="light" onClose={() => setError(null)}>
            <AlertIcon>
              <AlertCircle />
            </AlertIcon>
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={nextStatus} onValueChange={setNextStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="New status" />
            </SelectTrigger>
            <SelectContent>
              {WORKER_STATUSES.filter((s) => s !== worker.status).map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Reason (required unless setting Active)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !nextStatus || (nextStatus !== 'Active' && reason.trim().length === 0)}
          >
            {isLoading ? 'Updating...' : 'Update Status'}
          </Button>
        </div>
      </div>
    </RequirePermission>
  );
}

function AssignmentsSection({ worker }: { worker: DomesticWorkerProfileDto }) {
  const { data: assignments, isLoading, isFetching } = useWorkerAssignments({
    id: worker.domesticWorkerProfileId,
  });
  const [approveAssignment] = useApproveWorkerAssignment();
  const [deactivateAssignment] = useDeactivateWorkerAssignment();
  const [showAddForm, setShowAddForm] = useState(false);
  const [pendingAssignmentId, setPendingAssignmentId] = useState<string | null>(null);

  async function handleApprove(assignmentId: string) {
    setPendingAssignmentId(assignmentId);
    try {
      await approveAssignment({ assignmentId }).unwrap();
      toast.success('Assignment approved.');
    } catch (err) {
      toast.error(toUserMessage(err));
    } finally {
      setPendingAssignmentId(null);
    }
  }

  async function handleEnd(assignmentId: string) {
    setPendingAssignmentId(assignmentId);
    try {
      await deactivateAssignment({ assignmentId }).unwrap();
      toast.success('Assignment ended.');
    } catch (err) {
      toast.error(toUserMessage(err));
    } finally {
      setPendingAssignmentId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Flat assignments</h3>
        <RequirePermission permission={PERMISSIONS.domesticWorker.assignmentManage}>
          <Button size="sm" variant="outline" onClick={() => setShowAddForm((v) => !v)}>
            <Plus /> Add assignment
          </Button>
        </RequirePermission>
      </div>

      {showAddForm && (
        <AddAssignmentForm
          domesticWorkerProfileId={worker.domesticWorkerProfileId}
          onDone={() => setShowAddForm(false)}
        />
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm flex items-center gap-2">
          <InlineSpinner /> Loading assignments…
        </p>
      ) : !assignments || assignments.length === 0 ? (
        <p className="text-muted-foreground text-sm">No flat assignments yet.</p>
      ) : (
        <ul className="space-y-2">
          {assignments.map((assignment) => {
            const expired = isAssignmentExpired(assignment);
            return (
              <li
                key={assignment.domesticWorkerAssignmentId}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-md border border-border p-3 text-sm"
              >
                <div className="space-y-0.5">
                  <div className="font-mono text-xs text-muted-foreground">Flat ID: {assignment.flatId}</div>
                  <div>
                    Valid {new Date(assignment.validFromUtc).toLocaleDateString()}
                    {assignment.validToUtc
                      ? ` – ${new Date(assignment.validToUtc).toLocaleDateString()}`
                      : ' – ongoing'}
                  </div>
                  {(assignment.allowedDays || assignment.allowedStartTime) && (
                    <div className="text-muted-foreground">
                      {assignment.allowedDays || 'Every day'}
                      {assignment.allowedStartTime && assignment.allowedEndTime
                        ? `, ${assignment.allowedStartTime}–${assignment.allowedEndTime}`
                        : ''}
                    </div>
                  )}
                  <div className="flex gap-1.5 flex-wrap pt-1">
                    {!assignment.approvedByResident && (
                      <span className="text-amber-600 dark:text-amber-500 text-xs font-medium">Awaiting resident approval</span>
                    )}
                    {expired && <span className="text-destructive text-xs font-medium">Expired</span>}
                    {!assignment.isActive && (
                      <span className="text-muted-foreground text-xs font-medium">Ended</span>
                    )}
                  </div>
                </div>
                {assignment.isActive && (
                  <div className="flex gap-2 shrink-0">
                    {!assignment.approvedByResident && (
                      <RequirePermission permission={PERMISSIONS.domesticWorker.assignmentManage}>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pendingAssignmentId === assignment.domesticWorkerAssignmentId}
                          onClick={() => handleApprove(assignment.domesticWorkerAssignmentId)}
                        >
                          <Check /> Approve
                        </Button>
                      </RequirePermission>
                    )}
                    <RequirePermission permission={PERMISSIONS.domesticWorker.assignmentManage}>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={pendingAssignmentId === assignment.domesticWorkerAssignmentId}
                        onClick={() => handleEnd(assignment.domesticWorkerAssignmentId)}
                      >
                        <X /> End
                      </Button>
                    </RequirePermission>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {isFetching && !isLoading && <InlineSpinner className="text-muted-foreground" />}
    </div>
  );
}

function AddAssignmentForm({
  domesticWorkerProfileId,
  onDone,
}: {
  domesticWorkerProfileId: string;
  onDone: () => void;
}) {
  const [createAssignment, { isLoading }] = useCreateWorkerAssignment();
  const [buildingId, setBuildingId] = useState('');
  const [flatId, setFlatId] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [allowedDays, setAllowedDays] = useState('');
  const [allowedStart, setAllowedStart] = useState('');
  const [allowedEnd, setAllowedEnd] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    try {
      await createAssignment({
        id: domesticWorkerProfileId,
        createDomesticWorkerAssignmentRequest: {
          flatId,
          validFromUtc: new Date(validFrom).toISOString(),
          validToUtc: validTo ? new Date(validTo).toISOString() : null,
          allowedDays: allowedDays || null,
          allowedStartTime: allowedStart || null,
          allowedEndTime: allowedEnd || null,
        },
      }).unwrap();
      toast.success('Assignment added.');
      onDone();
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  return (
    <div className="rounded-md border border-border p-3 space-y-3 bg-muted/30">
      {error && (
        <Alert variant="destructive" appearance="light" onClose={() => setError(null)}>
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Building</Label>
          <BuildingSelect
            value={buildingId}
            onValueChange={(v) => {
              setBuildingId(v);
              setFlatId('');
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Flat</Label>
          <FlatSelect buildingId={buildingId} value={flatId} onValueChange={setFlatId} disabled={!buildingId} />
        </div>
        <div className="space-y-1.5">
          <Label>Valid from</Label>
          <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Valid to (optional)</Label>
          <Input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Allowed days (optional)</Label>
          <Input
            placeholder="e.g. Mon,Tue,Wed,Thu,Fri"
            value={allowedDays}
            onChange={(e) => setAllowedDays(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label>From (optional)</Label>
            <Input type="time" value={allowedStart} onChange={(e) => setAllowedStart(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>To (optional)</Label>
            <Input type="time" value={allowedEnd} onChange={(e) => setAllowedEnd(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={isLoading || !flatId || !validFrom}>
          {isLoading ? 'Saving...' : 'Save assignment'}
        </Button>
      </div>
    </div>
  );
}
