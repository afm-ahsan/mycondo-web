import { useState } from 'react';
import { CheckCheck, FileCheck, Receipt, Wrench } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import { useBillReadingIdempotentMutation } from '@/api/idempotentEndpoints';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { useIdempotencyKey } from '@/lib/idempotency/useIdempotencyKey';
import { CorrectReadingDialog } from '../components/CorrectReadingDialog';
import { useFinalizeReading, useReadingDetail, useReviewReading } from '../api/readingsApi';
import type { UtilityType } from '../lib/constants';
import { readingStatusToneMap, type ReadingStatus } from '../lib/readingStatus';
import type { ReadingDto } from '@/api/generated/mycondoApi';

interface ReadingDetailPageProps {
  utilityType: UtilityType;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-border last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export function ReadingDetailPage({ utilityType }: ReadingDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const { data: reading, isLoading, isError, error, refetch } = useReadingDetail({ id: id ?? '' }, { skip: !id });

  const [reviewReading, { isLoading: isReviewing }] = useReviewReading();
  const [finalizeReading, { isLoading: isFinalizing }] = useFinalizeReading();
  const [billReading, { isLoading: isBilling }] = useBillReadingIdempotentMutation();
  const [billKey, resetBillKey] = useIdempotencyKey();

  const [finalizeConfirmOpen, setFinalizeConfirmOpen] = useState(false);
  const [billConfirmOpen, setBillConfirmOpen] = useState(false);
  const [correctTarget, setCorrectTarget] = useState<ReadingDto | null>(null);

  async function handleReview() {
    if (!reading) return;
    try {
      await reviewReading({ id: reading.readingId }).unwrap();
      toast.success('Reading marked Reviewed.');
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  async function handleFinalize() {
    if (!reading) return;
    try {
      await finalizeReading({ id: reading.readingId }).unwrap();
      toast.success('Reading Finalized.');
      setFinalizeConfirmOpen(false);
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  async function handleBill() {
    if (!reading) return;
    try {
      const invoice = await billReading({ id: reading.readingId, idempotencyKey: billKey }).unwrap();
      toast.success(`Billed as invoice ${invoice.invoiceNumber}.`);
      resetBillKey();
      setBillConfirmOpen(false);
      refetch();
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (isError || !reading) {
    return (
      <Card>
        <ErrorState description={toUserMessage(error)} onRetry={refetch} />
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title={`Reading — ${reading.periodStart} to ${reading.periodEnd}`}
        crumbs={[{ label: 'Billing & Collections' }, { label: utilityType }, { label: 'Readings', path: `/utilities/${utilityType.toLowerCase()}/readings` }, { label: 'Detail' }]}
        secondaryActions={
          <div className="flex gap-2">
            {reading.status === 'Draft' && (
              <RequirePermission permission={PERMISSIONS.utility.readingRecord}>
                <Button variant="outline" onClick={handleReview} disabled={isReviewing}>
                  <CheckCheck /> {isReviewing ? 'Reviewing...' : 'Review'}
                </Button>
              </RequirePermission>
            )}
            {reading.status === 'Reviewed' && (
              <RequirePermission permission={PERMISSIONS.utility.readingFinalize}>
                <Button variant="outline" onClick={() => setFinalizeConfirmOpen(true)}>
                  <FileCheck /> Finalize
                </Button>
              </RequirePermission>
            )}
            {reading.status === 'Finalized' && (
              <RequirePermission permission={PERMISSIONS.utility.readingFinalize}>
                <Button onClick={() => setBillConfirmOpen(true)}>
                  <Receipt /> Bill
                </Button>
              </RequirePermission>
            )}
            {(reading.status === 'Finalized' || reading.status === 'Billed') && (
              <RequirePermission permission={PERMISSIONS.utility.readingCorrect}>
                <Button variant="destructive" onClick={() => setCorrectTarget(reading)}>
                  <Wrench /> Correct
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
              Reading Details
              <StatusBadge status={reading.status as ReadingStatus} toneMap={readingStatusToneMap} />
              {reading.isAbnormalConsumption && (
                <Badge variant="destructive" appearance="light">
                  System-detected abnormal consumption
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Flat" value={<span className="font-mono text-xs">{reading.flatId}</span>} />
            <DetailRow label="Meter" value={<span className="font-mono text-xs">{reading.meterId}</span>} />
            <DetailRow label="Period" value={`${reading.periodStart} – ${reading.periodEnd}`} />
            <DetailRow label="Previous reading" value={reading.previousReading} />
            <DetailRow label="Present reading" value={reading.presentReading} />
            <DetailRow label="Consumption" value={reading.consumptionUnits} />
            <DetailRow label="Reading date" value={reading.readingDate} />
            {reading.overrideReason && <DetailRow label="Continuity override reason" value={reading.overrideReason} />}
            {reading.isAbnormalConsumption && (
              <DetailRow
                label="Abnormal consumption reason"
                value={reading.abnormalConsumptionReason ?? 'Flagged by the system (no reason text returned).'}
              />
            )}
            {reading.invoiceId && (
              <DetailRow
                label="Invoice"
                value={
                  <Link to={`/billing/invoices/${reading.invoiceId}`} className="text-primary underline">
                    View invoice
                  </Link>
                }
              />
            )}
            {reading.correctsReadingId && (
              <DetailRow
                label="Corrects reading"
                value={
                  <Link to={`/utilities/${utilityType.toLowerCase()}/readings/${reading.correctsReadingId}`} className="text-primary underline">
                    View original reading
                  </Link>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmActionDialog
        open={finalizeConfirmOpen}
        onOpenChange={setFinalizeConfirmOpen}
        title="Finalize this reading?"
        description="Once finalized, this reading can only be changed through the Correct workflow — it cannot be edited directly."
        confirmLabel="Finalize"
        loadingLabel="Finalizing..."
        isLoading={isFinalizing}
        onConfirm={handleFinalize}
      />

      <ConfirmActionDialog
        open={billConfirmOpen}
        onOpenChange={setBillConfirmOpen}
        title="Bill this reading?"
        description={
          <>
            This issues an invoice for {reading.consumptionUnits} unit(s) of consumption and posts a ledger entry
            against the resident&rsquo;s balance. This cannot be undone directly — only through the Correct workflow.
          </>
        }
        confirmLabel="Bill"
        loadingLabel="Billing..."
        isLoading={isBilling}
        onConfirm={handleBill}
      />

      <CorrectReadingDialog
        reading={correctTarget}
        onOpenChange={(open) => !open && setCorrectTarget(null)}
        onCorrected={() => refetch()}
      />
    </>
  );
}
