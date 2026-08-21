import { Printer, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DateRangeFilter } from '@/components/shared/DateRangeFilter';
import { KpiCard } from '@/components/shared/KpiCard';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { formatDate } from '@/lib/helpers';
import { useIncomeExpenseReport } from '../api/reportsApi';
import type { IncomeExpenseLineDto } from '@/api/generated/mycondoApi';

function firstDayOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const FILTER_DEFAULTS = { fromDate: firstDayOfMonth(), toDate: today() };

function LinesTable({
  title,
  lines,
  total,
  emptyDescription,
}: {
  title: string;
  lines: IncomeExpenseLineDto[] | undefined;
  total: number | string | undefined;
  emptyDescription: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <CardTitle>{title}</CardTitle>
        </CardHeading>
      </CardHeader>
      <CardTable>
        {lines && lines.length === 0 ? (
          <EmptyState title="No activity" description={emptyDescription} />
        ) : (
          <ScrollArea>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(lines ?? []).map((line) => (
                  <TableRow key={line.chartOfAccountId}>
                    <TableCell>{line.code}</TableCell>
                    <TableCell>{line.name}</TableCell>
                    <TableCell>
                      <MoneyDisplay amount={line.amount} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-medium" colSpan={2}>
                    Total
                  </TableCell>
                  <TableCell className="font-medium">
                    <MoneyDisplay amount={total} />
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </CardTable>
    </Card>
  );
}

/**
 * Period income statement — three KPI cards (Income / Expense / Surplus-Deficit) followed by the
 * Income and Expense account breakdowns stacked as their own mini-tables (2-column on wide screens).
 */
export function IncomeExpenseReportPage() {
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);

  const { data, isFetching, isError, refetch } = useIncomeExpenseReport({
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
        title="Income & Expense"
        crumbs={[{ label: 'Finance' }, { label: 'Reports' }, { label: 'Income & Expense' }]}
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
        <ErrorState description="Couldn't load the income & expense report." onRetry={refetch} />
      ) : (
        <div id="print-root" className="space-y-4">
          <h3 className="text-muted-foreground text-sm font-medium">
            {data ? `${formatDate(data.metadata.fromDate ?? filters.fromDate)} – ${formatDate(data.metadata.toDate ?? filters.toDate)}` : '…'}
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <KpiCard label="Total Income" value={<MoneyDisplay amount={data?.totalIncome} />} icon={TrendingUp} isLoading={isFetching} tone="success" />
            <KpiCard label="Total Expense" value={<MoneyDisplay amount={data?.totalExpense} />} icon={TrendingDown} isLoading={isFetching} tone="destructive" />
            <KpiCard
              label="Surplus / Deficit"
              value={<MoneyDisplay amount={data?.surplusDeficit} emphasizeNegative />}
              icon={Wallet}
              isLoading={isFetching}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <LinesTable title="Income" lines={data?.incomeLines} total={data?.totalIncome} emptyDescription="No income posted in this period." />
            <LinesTable title="Expense" lines={data?.expenseLines} total={data?.totalExpense} emptyDescription="No expense posted in this period." />
          </div>
        </div>
      )}
    </>
  );
}
