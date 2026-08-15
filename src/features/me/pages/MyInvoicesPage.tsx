import { Receipt } from 'lucide-react';
import { Card, CardHeader, CardHeading, CardTable, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { toUserMessage } from '@/api/errors';
import { formatDate } from '@/lib/helpers';
import { useMyInvoices } from '../api/meApi';
import { invoiceStatusToneMap, type InvoiceStatus } from '../lib/invoiceStatus';

const MY_INVOICES_COLUMN_COUNT = 6;

/**
 * Self-service view of invoices for the caller's own owned/occupied flats — backed by mycondo-api's
 * GET /api/v1/me/invoices (Phase 3, mycondo-docs ADR-021, gated internally by invoice.view.own, never
 * the broad billing.invoice.view admin permission). No other flat's invoices are ever reachable here.
 */
export function MyInvoicesPage() {
  const { data, isFetching, isError, error, refetch } = useMyInvoices();

  return (
    <>
      <PageHeader title="My Invoices" crumbs={[{ label: 'My Invoices' }]} />
      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>My invoices</CardTitle>
          </CardHeading>
        </CardHeader>
        <CardTable>
          {isError ? (
            <ErrorState description={toUserMessage(error)} onRetry={refetch} />
          ) : !isFetching && (!data || data.length === 0) ? (
            <EmptyState
              icon={<Receipt className="size-8" aria-hidden="true" />}
              title="No invoices found"
              description="Invoices for your flats will appear here once issued."
            />
          ) : (
            <ScrollArea>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Invoice date</TableHead>
                    <TableHead>Due date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isFetching ? (
                    <TableSkeleton columns={MY_INVOICES_COLUMN_COUNT} />
                  ) : (
                    (data ?? []).map((invoice) => (
                      <TableRow key={invoice.invoiceId}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                        <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell>
                          <MoneyDisplay amount={invoice.totalAmount} />
                        </TableCell>
                        <TableCell>
                          <MoneyDisplay amount={invoice.balance} className="font-medium" />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={invoice.status as InvoiceStatus} toneMap={invoiceStatusToneMap} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </CardTable>
      </Card>
    </>
  );
}
