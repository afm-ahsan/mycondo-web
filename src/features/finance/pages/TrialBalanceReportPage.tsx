import { Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { formatDate } from '@/lib/helpers';
import { exportReportToCsv } from '@/lib/reports/exportCsv';
import { useTrialBalanceReport } from '../api/reportsApi';
import type { TrialBalanceLineDto } from '@/api/generated/mycondoApi';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const FILTER_DEFAULTS = { asOfDate: today() };

/**
 * Accounting-group report — each account's net Debit or Credit column, never both, so
 * sum(Debit column) === sum(Credit column) by construction (see the backend handler's doc comment:
 * this identity is structural, not asserted here). Reference report for CSV export — the project has
 * no PDF/Excel library, so `exportReportToCsv` (Blob + browser download, no dependency) is the export
 * story alongside the existing print pattern.
 */
export function TrialBalanceReportPage() {
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);

  const { data, isFetching, isError, refetch } = useTrialBalanceReport({
    asOfDate: filters.asOfDate,
  });

  const handleExport = () => {
    if (!data) return;
    exportReportToCsv(
      `trial-balance-${data.metadata.asOfDate ?? filters.asOfDate}`,
      [
        { header: 'Code', accessor: (l: TrialBalanceLineDto) => l.code },
        { header: 'Account', accessor: (l: TrialBalanceLineDto) => l.name },
        { header: 'Category', accessor: (l: TrialBalanceLineDto) => l.category },
        { header: 'Debit', accessor: (l: TrialBalanceLineDto) => l.debit },
        { header: 'Credit', accessor: (l: TrialBalanceLineDto) => l.credit },
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
        title="Trial Balance"
        crumbs={[{ label: 'Finance' }, { label: 'Reports' }, { label: 'Trial Balance' }]}
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
        <ErrorState description="Couldn't load the trial balance." onRetry={refetch} />
      ) : (
        <div id="print-root" className="space-y-4">
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>
                  Trial Balance{data ? ` — as of ${formatDate(data.metadata.asOfDate ?? filters.asOfDate)}` : ''}
                </CardTitle>
              </CardHeading>
              <CardToolbar>{isFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
            </CardHeader>
            <CardTable>
              {!isFetching && data?.lines.length === 0 ? (
                <EmptyState title="No activity" description="No account has posted activity as of this date." />
              ) : (
                <ScrollArea>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Debit</TableHead>
                        <TableHead>Credit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isFetching && !data ? (
                        <TableSkeleton columns={5} />
                      ) : (
                        (data?.lines ?? []).map((line) => (
                          <TableRow key={line.chartOfAccountId}>
                            <TableCell>{line.code}</TableCell>
                            <TableCell>{line.name}</TableCell>
                            <TableCell>{line.category}</TableCell>
                            <TableCell>
                              <MoneyDisplay amount={line.debit} />
                            </TableCell>
                            <TableCell>
                              <MoneyDisplay amount={line.credit} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell className="font-medium" colSpan={3}>
                          Total
                        </TableCell>
                        <TableCell className="font-medium">
                          <MoneyDisplay amount={data?.totalDebit} />
                        </TableCell>
                        <TableCell className="font-medium">
                          <MoneyDisplay amount={data?.totalCredit} />
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
