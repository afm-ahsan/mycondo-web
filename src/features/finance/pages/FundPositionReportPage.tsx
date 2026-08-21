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
import { useFundPositionReport } from '../api/reportsApi';
import type { FundPositionLineDto } from '@/api/generated/mycondoApi';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const FILTER_DEFAULTS = { asOfDate: today() };

/**
 * Fund is an optional ledger dimension (per the backend's own doc comments) — most postings never
 * attribute a fund, so a fund showing a zero balance is expected, not evidence of missing data. A
 * muted caption below the table says so instead of surfacing it as an error/empty state.
 */
export function FundPositionReportPage() {
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);

  const { data, isFetching, isError, refetch } = useFundPositionReport({
    asOfDate: filters.asOfDate,
  });

  const handleExport = () => {
    if (!data) return;
    exportReportToCsv(
      `fund-position-${data.metadata.asOfDate ?? filters.asOfDate}`,
      [
        { header: 'Code', accessor: (l: FundPositionLineDto) => l.code },
        { header: 'Fund', accessor: (l: FundPositionLineDto) => l.name },
        { header: 'Balance', accessor: (l: FundPositionLineDto) => l.balance },
      ],
      data.funds,
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
        title="Fund Position"
        crumbs={[{ label: 'Finance' }, { label: 'Reports' }, { label: 'Fund Position' }]}
      />

      <Card className="mb-4" id="print-hide-on-print">
        <CardHeader>
          <CardHeading>
            <CardTitle>Filters</CardTitle>
          </CardHeading>
          <CardToolbar>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={!data?.funds.length}>
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
        <ErrorState description="Couldn't load the fund position." onRetry={refetch} />
      ) : (
        <div id="print-root" className="space-y-4">
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>
                  Fund Position{data ? ` — as of ${formatDate(data.metadata.asOfDate ?? filters.asOfDate)}` : ''}
                </CardTitle>
              </CardHeading>
              <CardToolbar>{isFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
            </CardHeader>
            <CardTable>
              {!isFetching && data?.funds.length === 0 ? (
                <EmptyState title="No funds" description="No fund dimension has been set up yet." />
              ) : (
                <ScrollArea>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Fund</TableHead>
                        <TableHead>Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isFetching && !data ? (
                        <TableSkeleton columns={3} />
                      ) : (
                        (data?.funds ?? []).map((fund) => (
                          <TableRow key={fund.fundId}>
                            <TableCell>{fund.code}</TableCell>
                            <TableCell>{fund.name}</TableCell>
                            <TableCell>
                              <MoneyDisplay amount={fund.balance} />
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
                          <MoneyDisplay amount={data?.totalBalance} />
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              )}
            </CardTable>
          </Card>
          <p className="text-muted-foreground text-xs">
            Fund is an optional ledger dimension — a fund showing a zero balance simply means no posting has been
            attributed to it yet, not a data problem.
          </p>
        </div>
      )}
    </>
  );
}
