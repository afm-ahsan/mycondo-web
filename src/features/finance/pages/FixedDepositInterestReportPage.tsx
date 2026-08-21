import { AlertTriangle, CheckCircle2, Download, Printer, Receipt, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DateRangeFilter } from '@/components/shared/DateRangeFilter';
import { KpiCard } from '@/components/shared/KpiCard';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { formatDate } from '@/lib/helpers';
import { exportReportToCsv } from '@/lib/reports/exportCsv';
import { useFixedDepositInterestReport } from '../api/reportsApi';
import type { FixedDepositInterestLineDto } from '@/api/generated/mycondoApi';

function firstDayOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const FILTER_DEFAULTS = { fromDate: firstDayOfMonth(), toDate: today() };

/**
 * Gross/Deduction/Net are kept as separate KPI cards, never pre-combined (Template 4's interest-
 * receipt invariant: NetAmount = GrossAmount - DeductionAmount is the backend's identity to display,
 * not the frontend's to compute). `isReconciled` compares `accruedGrossForPeriod` against
 * `ledgerInterestIncomeForPeriod` and is surfaced rather than hidden, same as ExpenseSummaryReportPage.
 */
export function FixedDepositInterestReportPage() {
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);

  const { data, isFetching, isError, refetch } = useFixedDepositInterestReport({
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  });

  const handleExport = () => {
    if (!data) return;
    exportReportToCsv(
      `fixed-deposit-interest-${filters.fromDate}-to-${filters.toDate}`,
      [
        { header: 'Certificate #', accessor: (l: FixedDepositInterestLineDto) => l.certificateNumber },
        { header: 'Accrued Gross', accessor: (l: FixedDepositInterestLineDto) => l.accruedGrossForPeriod },
        { header: 'Received Gross', accessor: (l: FixedDepositInterestLineDto) => l.receivedGrossForPeriod },
        { header: 'Received Deduction', accessor: (l: FixedDepositInterestLineDto) => l.receivedDeductionForPeriod },
        { header: 'Received Net', accessor: (l: FixedDepositInterestLineDto) => l.receivedNetForPeriod },
      ],
      data.byFixedDeposit,
    );
  };

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
        title="Fixed Deposit Interest"
        crumbs={[{ label: 'Finance' }, { label: 'Reports' }, { label: 'Fixed Deposit Interest' }]}
      />

      <Card className="mb-4" id="print-hide-on-print">
        <CardHeader>
          <CardHeading>
            <CardTitle>Filters</CardTitle>
          </CardHeading>
          <CardToolbar>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={!data?.byFixedDeposit.length}>
              <Download /> Export CSV
            </Button>
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
        <ErrorState description="Couldn't load the fixed deposit interest report." onRetry={refetch} />
      ) : (
        <div id="print-root" className="space-y-4">
          <div>
            <h3 className="text-muted-foreground text-sm font-medium mb-2">
              {data ? `${formatDate(data.metadata.fromDate ?? filters.fromDate)} – ${formatDate(data.metadata.toDate ?? filters.toDate)}` : '…'}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <KpiCard label="Accrued Gross" value={<MoneyDisplay amount={data?.accruedGrossForPeriod} />} icon={Wallet} isLoading={isFetching} />
              <KpiCard
                label="Ledger Interest Income"
                value={<MoneyDisplay amount={data?.ledgerInterestIncomeForPeriod} />}
                icon={Receipt}
                isLoading={isFetching}
              />
              <KpiCard
                label="Reconciliation"
                value={data?.isReconciled ? 'Reconciled' : 'Mismatch'}
                icon={!data || data.isReconciled ? CheckCircle2 : AlertTriangle}
                isLoading={isFetching}
                tone={!data || data.isReconciled ? 'success' : 'destructive'}
              />
            </div>
          </div>

          <div>
            <h3 className="text-muted-foreground text-sm font-medium mb-2">Received interest (Gross − Deduction = Net)</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Received Gross" value={<MoneyDisplay amount={data?.receivedGrossForPeriod} />} isLoading={isFetching} />
              <KpiCard label="Received Deduction" value={<MoneyDisplay amount={data?.receivedDeductionForPeriod} />} isLoading={isFetching} tone="warning" />
              <KpiCard label="Received Net" value={<MoneyDisplay amount={data?.receivedNetForPeriod} />} isLoading={isFetching} tone="success" />
              <KpiCard
                label="Outstanding Accrued (Not Received)"
                value={<MoneyDisplay amount={data?.outstandingAccruedNotReceivedAsOfToDate} />}
                isLoading={isFetching}
                tone="warning"
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Breakdown by fixed deposit</CardTitle>
              </CardHeading>
              <CardToolbar>{isFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
            </CardHeader>
            <CardTable>
              {!isFetching && data?.byFixedDeposit.length === 0 ? (
                <EmptyState title="No fixed deposits" description="No fixed deposit interest activity was found in this period." />
              ) : (
                <ScrollArea>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Certificate #</TableHead>
                        <TableHead>Accrued Gross</TableHead>
                        <TableHead>Received Gross</TableHead>
                        <TableHead>Received Deduction</TableHead>
                        <TableHead>Received Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isFetching && !data ? (
                        <TableSkeleton columns={5} />
                      ) : (
                        (data?.byFixedDeposit ?? []).map((line) => (
                          <TableRow key={line.fixedDepositId}>
                            <TableCell>{line.certificateNumber}</TableCell>
                            <TableCell>
                              <MoneyDisplay amount={line.accruedGrossForPeriod} />
                            </TableCell>
                            <TableCell>
                              <MoneyDisplay amount={line.receivedGrossForPeriod} />
                            </TableCell>
                            <TableCell>
                              <MoneyDisplay amount={line.receivedDeductionForPeriod} />
                            </TableCell>
                            <TableCell>
                              <MoneyDisplay amount={line.receivedNetForPeriod} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell className="font-medium">Total</TableCell>
                        <TableCell className="font-medium">
                          <MoneyDisplay amount={data?.accruedGrossForPeriod} />
                        </TableCell>
                        <TableCell className="font-medium">
                          <MoneyDisplay amount={data?.receivedGrossForPeriod} />
                        </TableCell>
                        <TableCell className="font-medium">
                          <MoneyDisplay amount={data?.receivedDeductionForPeriod} />
                        </TableCell>
                        <TableCell className="font-medium">
                          <MoneyDisplay amount={data?.receivedNetForPeriod} />
                        </TableCell>
                      </TableRow>
                    </TableFooter>
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
