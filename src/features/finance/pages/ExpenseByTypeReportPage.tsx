import { Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DateRangeFilter } from '@/components/shared/DateRangeFilter';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { formatDate } from '@/lib/helpers';
import { exportReportToCsv } from '@/lib/reports/exportCsv';
import { useExpenseByTypeReport } from '../api/reportsApi';
import type { ExpenseByTypeLineDto } from '@/api/generated/mycondoApi';

function firstDayOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const FILTER_DEFAULTS = { fromDate: firstDayOfMonth(), toDate: today() };

/**
 * The generated `ExpenseByTypeLineDto` has no `percentageOfTotal` field, so this report shows
 * Type / Category / Count / Amount only — matching the actual contract rather than fabricating a
 * percentage the backend doesn't compute.
 */
export function ExpenseByTypeReportPage() {
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);

  const { data, isFetching, isError, refetch } = useExpenseByTypeReport({
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  });

  const handleExport = () => {
    if (!data) return;
    exportReportToCsv(
      `expense-by-type-${filters.fromDate}-to-${filters.toDate}`,
      [
        { header: 'Type', accessor: (l: ExpenseByTypeLineDto) => l.typeName },
        { header: 'Category', accessor: (l: ExpenseByTypeLineDto) => l.categoryName },
        { header: 'Count', accessor: (l: ExpenseByTypeLineDto) => l.count },
        { header: 'Amount', accessor: (l: ExpenseByTypeLineDto) => l.totalAmount },
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
        title="Expense by Type"
        crumbs={[{ label: 'Finance' }, { label: 'Reports' }, { label: 'Expense by Type' }]}
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
          <DateRangeFilter
            fromDate={filters.fromDate}
            toDate={filters.toDate}
            onFromDateChange={(v) => setFilters({ fromDate: v })}
            onToDateChange={(v) => setFilters({ toDate: v })}
          />
        </div>
      </Card>

      {isError ? (
        <ErrorState description="Couldn't load the expense by type report." onRetry={refetch} />
      ) : (
        <div id="print-root" className="space-y-4">
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>
                  Expense by Type
                  {data ? ` — ${formatDate(data.metadata.fromDate ?? filters.fromDate)} to ${formatDate(data.metadata.toDate ?? filters.toDate)}` : ''}
                </CardTitle>
              </CardHeading>
              <CardToolbar>{isFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
            </CardHeader>
            <CardTable>
              {!isFetching && data?.lines.length === 0 ? (
                <EmptyState title="No expenses" description="No expenses were recorded in this period." />
              ) : (
                <ScrollArea>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Count</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isFetching && !data ? (
                        <TableSkeleton columns={4} />
                      ) : (
                        (data?.lines ?? []).map((line) => (
                          <TableRow key={line.expenseTypeId}>
                            <TableCell>{line.typeName}</TableCell>
                            <TableCell>{line.categoryName}</TableCell>
                            <TableCell>{line.count}</TableCell>
                            <TableCell>
                              <MoneyDisplay amount={line.totalAmount} />
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
                          <MoneyDisplay amount={data?.total} />
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
