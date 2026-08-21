import { AlertTriangle, CheckCircle2, Printer, Receipt, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DateRangeFilter } from '@/components/shared/DateRangeFilter';
import { KpiCard } from '@/components/shared/KpiCard';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { formatDate } from '@/lib/helpers';
import { useExpenseSummaryReport } from '../api/reportsApi';

function firstDayOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const FILTER_DEFAULTS = { fromDate: firstDayOfMonth(), toDate: today() };

/**
 * `ledgerTotal` (ledger-derived) is the authoritative figure; `sourceRecordTotal` (sum of source
 * expense records) is shown alongside for comparison. `isReconciled` surfaces a mismatch between the
 * two rather than hiding it — a legitimate signal, not something to suppress (see Template 5 task
 * brief).
 */
export function ExpenseSummaryReportPage() {
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);

  const { data, isFetching, isError, refetch } = useExpenseSummaryReport({
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  });

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-root, #print-root * { visibility: visible; }
          #print-root { position: absolute; inset: 0; width: 100%; margin: 0; padding: 0; }
          #print-hide-on-print { display: none !important; }
        }
      `}</style>

      <PageHeader
        title="Expense Summary"
        crumbs={[{ label: 'Finance' }, { label: 'Reports' }, { label: 'Expense Summary' }]}
      />

      <Card className="mb-4" id="print-hide-on-print">
        <CardHeader>
          <CardHeading>
            <CardTitle>Filters</CardTitle>
          </CardHeading>
          <CardToolbar>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer /> Print
            </Button>
          </CardToolbar>
        </CardHeader>
        <div className="flex flex-wrap gap-4 p-4">
          <DateRangeFilter
            fromDate={filters.fromDate}
            toDate={filters.toDate}
            onFromDateChange={(v) => setFilters({ fromDate: v })}
            onToDateChange={(v) => setFilters({ toDate: v })}
          />
        </div>
      </Card>

      {isError ? (
        <ErrorState description="Couldn't load the expense summary." onRetry={refetch} />
      ) : (
        <div id="print-root" className="space-y-4">
          <div>
            <h3 className="text-muted-foreground text-sm font-medium mb-2">
              {data ? `${formatDate(data.metadata.fromDate ?? filters.fromDate)} – ${formatDate(data.metadata.toDate ?? filters.toDate)}` : '…'}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <KpiCard label="Ledger Total" value={<MoneyDisplay amount={data?.ledgerTotal} />} icon={Wallet} isLoading={isFetching} tone="primary" />
              <KpiCard label="Source Record Total" value={<MoneyDisplay amount={data?.sourceRecordTotal} />} icon={Receipt} isLoading={isFetching} />
              <KpiCard
                label="Reconciliation"
                value={data?.isReconciled ? 'Reconciled' : 'Mismatch'}
                icon={!data || data.isReconciled ? CheckCircle2 : AlertTriangle}
                isLoading={isFetching}
                tone={!data || data.isReconciled ? 'success' : 'destructive'}
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Breakdown by status</CardTitle>
              </CardHeading>
              <CardToolbar>{isFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
            </CardHeader>
            <CardTable>
              {!isFetching && data?.byStatus.length === 0 ? (
                <EmptyState title="No expenses" description="No expenses were recorded in this period." />
              ) : (
                <ScrollArea>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Count</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data?.byStatus ?? []).map((line) => (
                        <TableRow key={line.status}>
                          <TableCell>{line.status}</TableCell>
                          <TableCell>{line.count}</TableCell>
                          <TableCell>
                            <MoneyDisplay amount={line.totalAmount} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              )}
            </CardTable>
          </Card>
        </div>
      )}
    </>
  );
}
