import { useState } from 'react';
import { XCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { toUserMessage } from '@/api/errors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { VoidInvoiceDialog } from '../components/VoidInvoiceDialog';
import { useInvoiceDetail } from '../api/invoicesApi';
import { formatBillingPeriod } from '../lib/billingPeriod';
import { formatDate, formatDateTime } from '@/lib/helpers';
import { invoiceStatusToneMap, type InvoiceStatus } from '../lib/invoiceStatus';
import { StatusBadge } from '@/components/ui/status-badge';
import type { InvoiceDto } from '@/api/generated/mycondoApi';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-border last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useInvoiceDetail({ id: id ?? '' }, { skip: !id });
  const [voidTarget, setVoidTarget] = useState<InvoiceDto | null>(null);

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (isError || !data) {
    return (
      <Card>
        <ErrorState description={toUserMessage(error)} onRetry={refetch} />
      </Card>
    );
  }

  const { invoice, lines } = data;
  const canVoid = invoice.status === 'Issued' && Number(invoice.amountPaid) === 0;

  return (
    <>
      <PageHeader
        title={invoice.invoiceNumber}
        crumbs={[{ label: 'Finance' }, { label: 'Invoices', path: '/billing/invoices' }, { label: 'Detail' }]}
        secondaryActions={
          canVoid && (
            <RequirePermission permission={PERMISSIONS.billing.invoiceVoid}>
              <Button variant="destructive" onClick={() => setVoidTarget(invoice)}>
                <XCircle /> Void
              </Button>
            </RequirePermission>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Invoice Details
              <StatusBadge status={invoice.status as InvoiceStatus} toneMap={invoiceStatusToneMap} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Source" value={invoice.source} />
            <DetailRow label="Flat" value={<span className="font-mono text-xs">{invoice.flatId}</span>} />
            <DetailRow label="Billing period" value={formatBillingPeriod(invoice.periodStart, invoice.periodEnd)} />
            <DetailRow label="Invoice date" value={formatDate(invoice.invoiceDate)} />
            <DetailRow label="Due date" value={formatDate(invoice.dueDate)} />
            <DetailRow label="Subtotal" value={<MoneyDisplay amount={invoice.subtotalAmount} />} />
            <DetailRow label="Total" value={<MoneyDisplay amount={invoice.totalAmount} className="font-semibold" />} />
            <DetailRow label="Paid" value={<MoneyDisplay amount={invoice.amountPaid} />} />
            <DetailRow label="Outstanding balance" value={<MoneyDisplay amount={invoice.balance} className="font-semibold" />} />
            {invoice.voidedAtUtc && (
              <>
                <DetailRow label="Voided at" value={formatDateTime(invoice.voidedAtUtc)} />
                <DetailRow label="Void reason" value={invoice.voidReason ?? '—'} />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Payment Allocations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              The API does not currently expose which payment(s) were allocated against this specific invoice — only
              the running Paid/Outstanding totals above (both server-computed and authoritative). Look up the
              originating payment directly to see its own allocation breakdown.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm">Invoice Lines</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-xs mb-3">
            Stored snapshot at issue time — never recalculated from the current live rule, rate, or flat area.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => (
                <TableRow key={line.invoiceLineId}>
                  <TableCell>{line.description}</TableCell>
                  <TableCell>{line.ruleCategorySnapshot}</TableCell>
                  <TableCell>{line.calculationMethodSnapshot}</TableCell>
                  <TableCell className="text-right">
                    <MoneyDisplay amount={line.rateSnapshot} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
                  <TableCell className="text-right">
                    <MoneyDisplay amount={line.lineAmount} className="font-medium" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <VoidInvoiceDialog invoice={voidTarget} onOpenChange={(open) => !open && setVoidTarget(null)} />
    </>
  );
}
