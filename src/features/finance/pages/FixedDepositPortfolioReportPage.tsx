import { Download, Landmark, PiggyBank, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { KpiCard } from '@/components/shared/KpiCard';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { formatDate } from '@/lib/helpers';
import { exportReportToCsv } from '@/lib/reports/exportCsv';
import { useFixedDepositPortfolioReport } from '../api/reportsApi';
import type { FixedDepositPortfolioLineDto } from '@/api/generated/mycondoApi';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const FILTER_DEFAULTS = { asOfDate: today() };

/**
 * `asOfDate`-only report — no fromDate/toDate. The generated `FixedDepositPortfolioLineDto` carries
 * three distinct interest figures per FD (accrued, received, outstanding-accrued); all three are
 * shown as separate columns rather than combined, consistent with the project's rule of never
 * pre-combining permanently-distinct financial figures.
 */
export function FixedDepositPortfolioReportPage() {
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);

  const { data, isFetching, isError, refetch } = useFixedDepositPortfolioReport({
    asOfDate: filters.asOfDate,
  });

  const handleExport = () => {
    if (!data) return;
    exportReportToCsv(
      `fixed-deposit-portfolio-${data.metadata.asOfDate ?? filters.asOfDate}`,
      [
        { header: 'Certificate #', accessor: (l: FixedDepositPortfolioLineDto) => l.certificateNumber },
        { header: 'Bank', accessor: (l: FixedDepositPortfolioLineDto) => l.bankName },
        { header: 'Branch', accessor: (l: FixedDepositPortfolioLineDto) => l.branchName },
        { header: 'Principal', accessor: (l: FixedDepositPortfolioLineDto) => l.principal },
        { header: 'Rate %', accessor: (l: FixedDepositPortfolioLineDto) => l.interestRatePercent },
        { header: 'Start Date', accessor: (l: FixedDepositPortfolioLineDto) => l.startDate },
        { header: 'Maturity Date', accessor: (l: FixedDepositPortfolioLineDto) => l.maturityDate },
        { header: 'Status', accessor: (l: FixedDepositPortfolioLineDto) => l.status },
        { header: 'Accrued Interest', accessor: (l: FixedDepositPortfolioLineDto) => l.totalAccruedInterest },
        { header: 'Received Interest', accessor: (l: FixedDepositPortfolioLineDto) => l.totalReceivedInterest },
        { header: 'Outstanding Accrued Interest', accessor: (l: FixedDepositPortfolioLineDto) => l.outstandingAccruedInterest },
      ],
      data.lines,
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
        title="Fixed Deposit Portfolio"
        crumbs={[{ label: 'Finance' }, { label: 'Reports' }, { label: 'Fixed Deposit Portfolio' }]}
      />

      <Card className="mb-4" id="print-hide-on-print">
        <CardHeader>
          <CardHeading>
            <CardTitle>Filters</CardTitle>
          </CardHeading>
          <CardToolbar>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={!data?.lines.length}>
              <Download /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer /> Print
            </Button>
          </CardToolbar>
        </CardHeader>
        <div className="flex flex-wrap gap-4 p-4">
          <div className="space-y-1">
            <Label>As of</Label>
            <Input type="date" value={filters.asOfDate} onChange={(e) => setFilters({ asOfDate: e.target.value })} />
          </div>
        </div>
      </Card>

      {isError ? (
        <ErrorState description="Couldn't load the fixed deposit portfolio report." onRetry={refetch} />
      ) : (
        <div id="print-root" className="space-y-4">
          <div>
            <h3 className="text-muted-foreground text-sm font-medium mb-2">
              As of {data ? formatDate(data.metadata.asOfDate ?? filters.asOfDate) : '…'}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <KpiCard label="Total Principal" value={<MoneyDisplay amount={data?.totalPrincipal} />} icon={PiggyBank} isLoading={isFetching} />
              <KpiCard
                label="Total Outstanding Accrued Interest"
                value={<MoneyDisplay amount={data?.totalOutstandingAccruedInterest} />}
                icon={Landmark}
                isLoading={isFetching}
                tone="warning"
              />
              <KpiCard label="Active Count" value={data?.activeCount ?? 0} isLoading={isFetching} tone="success" />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Fixed deposits</CardTitle>
              </CardHeading>
              <CardToolbar>{isFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
            </CardHeader>
            <CardTable>
              {!isFetching && data?.lines.length === 0 ? (
                <EmptyState title="No fixed deposits" description="No fixed deposits were found as of this date." />
              ) : (
                <ScrollArea>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Certificate #</TableHead>
                        <TableHead>Bank / Branch</TableHead>
                        <TableHead>Principal</TableHead>
                        <TableHead>Rate %</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Maturity Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Accrued Interest</TableHead>
                        <TableHead>Received Interest</TableHead>
                        <TableHead>Outstanding Accrued Interest</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isFetching && !data ? (
                        <TableSkeleton columns={10} />
                      ) : (
                        (data?.lines ?? []).map((line) => (
                          <TableRow key={line.fixedDepositId}>
                            <TableCell>{line.certificateNumber}</TableCell>
                            <TableCell>
                              {line.bankName}
                              {line.branchName ? ` / ${line.branchName}` : ''}
                            </TableCell>
                            <TableCell>
                              <MoneyDisplay amount={line.principal} />
                            </TableCell>
                            <TableCell>{Number(line.interestRatePercent).toFixed(2)}%</TableCell>
                            <TableCell>{formatDate(line.startDate)}</TableCell>
                            <TableCell>{formatDate(line.maturityDate)}</TableCell>
                            <TableCell>{line.status}</TableCell>
                            <TableCell>
                              <MoneyDisplay amount={line.totalAccruedInterest} />
                            </TableCell>
                            <TableCell>
                              <MoneyDisplay amount={line.totalReceivedInterest} />
                            </TableCell>
                            <TableCell>
                              <MoneyDisplay amount={line.outstandingAccruedInterest} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell className="font-medium" colSpan={2}>
                          Total
                        </TableCell>
                        <TableCell className="font-medium">
                          <MoneyDisplay amount={data?.totalPrincipal} />
                        </TableCell>
                        <TableCell colSpan={4} />
                        <TableCell />
                        <TableCell />
                        <TableCell className="font-medium">
                          <MoneyDisplay amount={data?.totalOutstandingAccruedInterest} />
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
