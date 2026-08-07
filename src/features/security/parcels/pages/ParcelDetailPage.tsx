import { useState } from 'react';
import { Bell, LogIn, MessageSquareWarning, XCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge, type StatusBadgeMap } from '@/components/ui/status-badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';
import { formatDateTime } from '@/lib/helpers';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { CloseParcelDialog } from '../components/CloseParcelDialog';
import { CollectParcelDialog } from '../components/CollectParcelDialog';
import { MarkDamagedDialog } from '../components/MarkDamagedDialog';
import { useNotifyResident, useParcel, useParcelCustodyHistory } from '../api/parcelsApi';
import { PARCEL_STATUSES, TERMINAL_PARCEL_STATUSES } from '../lib/constants';

type ParcelStatus = (typeof PARCEL_STATUSES)[number];

const statusToneMap: StatusBadgeMap<ParcelStatus> = {
  Received: { label: 'Received', variant: 'info' },
  ResidentNotified: { label: 'Notified', variant: 'info' },
  AwaitingCollection: { label: 'Awaiting Collection', variant: 'warning' },
  Collected: { label: 'Collected', variant: 'success' },
  Returned: { label: 'Returned', variant: 'secondary' },
  Rejected: { label: 'Rejected', variant: 'destructive' },
  Damaged: { label: 'Damaged', variant: 'destructive' },
  LostOrEscalated: { label: 'Lost / Escalated', variant: 'destructive' },
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-border last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export function ParcelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: parcel, isLoading, isError, error, refetch } = useParcel({ id: id ?? '' }, { skip: !id });
  const { data: history } = useParcelCustodyHistory({ id: id ?? '' }, { skip: !id });
  const [notifyResident, { isLoading: isNotifying }] = useNotifyResident();
  const [collectTarget, setCollectTarget] = useState<string | null>(null);
  const [damagedTarget, setDamagedTarget] = useState<string | null>(null);
  const [closeTarget, setCloseTarget] = useState<string | null>(null);

  async function handleNotify() {
    if (!parcel) return;
    try {
      await notifyResident({ id: parcel.parcelId }).unwrap();
      toast.success('Resident marked as notified.');
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (isError || !parcel) {
    return (
      <Card>
        <ErrorState description={toUserMessage(error)} onRetry={refetch} />
      </Card>
    );
  }

  const isTerminal = TERMINAL_PARCEL_STATUSES.includes(parcel.status as (typeof TERMINAL_PARCEL_STATUSES)[number]);

  return (
    <>
      <PageHeader
        title={parcel.parcelReference ?? parcel.trackingNumber ?? 'Parcel'}
        crumbs={[{ label: 'Front Desk' }, { label: 'Parcels', path: '/security/parcels' }, { label: 'Detail' }]}
        secondaryActions={
          <div className="flex gap-2">
            {!isTerminal && parcel.status === 'Received' && (
              <RequirePermission permission={PERMISSIONS.parcel.notify}>
                <Button variant="outline" onClick={handleNotify} disabled={isNotifying}>
                  <Bell /> {isNotifying ? 'Notifying...' : 'Mark Resident Notified'}
                </Button>
              </RequirePermission>
            )}
            {!isTerminal && (
              <RequirePermission permission={PERMISSIONS.parcel.handover}>
                <Button onClick={() => setCollectTarget(parcel.parcelId)}>
                  <LogIn /> Record Collection
                </Button>
              </RequirePermission>
            )}
            {!isTerminal && (
              <RequirePermission permission={PERMISSIONS.parcel.update}>
                <Button variant="outline" onClick={() => setDamagedTarget(parcel.parcelId)}>
                  <MessageSquareWarning /> Mark Damaged
                </Button>
              </RequirePermission>
            )}
            {!isTerminal && (
              <RequirePermission permission={PERMISSIONS.parcel.return}>
                <Button variant="destructive" onClick={() => setCloseTarget(parcel.parcelId)}>
                  <XCircle /> Close
                </Button>
              </RequirePermission>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Parcel Details
              <StatusBadge status={parcel.status as ParcelStatus} toneMap={statusToneMap} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Reference" value={parcel.parcelReference ?? '—'} />
            <DetailRow label="Tracking number" value={parcel.trackingNumber ?? '—'} />
            <DetailRow label="Courier" value={parcel.courierProvider ?? '—'} />
            <DetailRow label="Sender" value={parcel.senderName ?? '—'} />
            <DetailRow label="Recipient flat" value={<span className="font-mono text-xs">{parcel.recipientFlatId}</span>} />
            <DetailRow label="Type" value={`${parcel.parcelType} (${parcel.packageCount} package${Number(parcel.packageCount) === 1 ? '' : 's'})`} />
            <DetailRow label="Storage location" value={parcel.storageLocation ?? '—'} />
            <DetailRow label="Notification status" value={parcel.notificationStatus} />
            <DetailRow label="Received at" value={formatDateTime(parcel.receivedAtUtc)} />
            {parcel.collectedAtUtc && <DetailRow label="Collected at" value={formatDateTime(parcel.collectedAtUtc)} />}
            {parcel.collectorName && <DetailRow label="Collected by" value={parcel.collectorName} />}
            {parcel.collectionAcknowledgement && (
              <DetailRow label="Acknowledgement" value={parcel.collectionAcknowledgement} />
            )}
            {parcel.damageNote && <DetailRow label="Damage note" value={parcel.damageNote} />}
            {parcel.closeReason && <DetailRow label="Close reason" value={parcel.closeReason} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Custody History</CardTitle>
          </CardHeader>
          <CardContent>
            {!history || history.length === 0 ? (
              <p className="text-muted-foreground text-sm">No history yet.</p>
            ) : (
              <ol className="space-y-3">
                {history.map((event) => (
                  <li key={event.parcelCustodyEventId} className="flex flex-col border-s-2 border-border ps-3">
                    <span className="font-medium text-sm">{event.toStatus}</span>
                    <span className="text-muted-foreground text-xs">{formatDateTime(event.occurredAtUtc)}</span>
                    {event.performedBy && <span className="text-xs">By {event.performedBy}</span>}
                    {event.notes && <span className="text-xs">{event.notes}</span>}
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <CollectParcelDialog parcelId={collectTarget} onOpenChange={(open) => !open && setCollectTarget(null)} />
      <MarkDamagedDialog parcelId={damagedTarget} onOpenChange={(open) => !open && setDamagedTarget(null)} />
      <CloseParcelDialog parcelId={closeTarget} onOpenChange={(open) => !open && setCloseTarget(null)} />
    </>
  );
}
