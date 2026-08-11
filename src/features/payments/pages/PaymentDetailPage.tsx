import { useState } from 'react';
import { Undo2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { toUserMessage } from '@/api/errors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { AllocationSummary } from '../components/AllocationSummary';
import { ReversePaymentDialog } from '../components/ReversePaymentDialog';
import { usePaymentDetail } from '../api/paymentsApi';
import { paymentStatusToneMap, type PaymentStatus } from '../lib/paymentStatus';
import type { PaymentDto } from '@/api/generated/mycondoApi';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-border last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: payment, isLoading, isError, error, refetch } = usePaymentDetail({ id: id ?? '' }, { skip: !id });
  const [reverseTarget, setReverseTarget] = useState<PaymentDto | null>(null);

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (isError || !payment) {
    return (
      <Card>
        <ErrorState description={toUserMessage(error)} onRetry={refetch} />
      </Card>
    );
  }

  const canReverse = payment.status === 'Posted';

  return (
    <>
      <PageHeader
        title={payment.referenceNumber ?? `Payment for flat ${payment.flatId}`}
        crumbs={[{ label: 'Finance' }, { label: 'Payments', path: '/billing/payments' }, { label: 'Detail' }]}
        secondaryActions={
          canReverse && (
            <RequirePermission permission={PERMISSIONS.payment.reverse}>
              <Button variant="destructive" onClick={() => setReverseTarget(payment)}>
                <Undo2 /> Reverse
              </Button>
            </RequirePermission>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Payment Details
              <StatusBadge status={payment.status as PaymentStatus} toneMap={paymentStatusToneMap} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Flat" value={<span className="font-mono text-xs">{payment.flatId}</span>} />
            <DetailRow label="Amount" value={<MoneyDisplay amount={payment.amount} className="font-semibold" />} />
            <DetailRow label="Method" value={payment.paymentMethod} />
            <DetailRow label="Reference" value={payment.referenceNumber ?? '—'} />
            <DetailRow label="Business date" value={payment.businessDate} />
            {payment.reversedAtUtc && (
              <>
                <DetailRow label="Reversed at" value={new Date(payment.reversedAtUtc).toLocaleString()} />
                <DetailRow label="Reversal reason" value={payment.reversalReason ?? '—'} />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Allocations</CardTitle>
          </CardHeader>
          <CardContent>
            <AllocationSummary allocations={payment.allocations} />
          </CardContent>
        </Card>
      </div>

      <ReversePaymentDialog
        payment={reverseTarget}
        onOpenChange={(open) => !open && setReverseTarget(null)}
        onReversed={() => refetch()}
      />
    </>
  );
}
