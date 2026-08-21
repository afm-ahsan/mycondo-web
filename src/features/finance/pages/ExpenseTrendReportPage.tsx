import type { ApexOptions } from 'apexcharts';
import { Download, Printer } from 'lucide-react';
import ApexChart from 'react-apexcharts';
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
import { useExpenseTrendReport } from '../api/reportsApi';
import type { ExpenseTrendMonthDto } from '@/api/generated/mycondoApi';

const MONTH_ABBREVIATIONS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function monthLabel(month: ExpenseTrendMonthDto): string {
  const monthIndex = Number(month.month) - 1;
  return `${MONTH_ABBREVIATIONS[monthIndex] ?? month.month} ${month.year}`;
}

function buildTrendChartOptions(categories: string[]): ApexOptions {
  return {
    chart: { type: 'bar', height: 300, toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
    dataLabels: { enabled: false },
    legend: { show: false },
    colors: ['var(--color-primary)'],
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: 'var(--color-secondary-foreground)', fontSize: '12px' } },
    },
    yaxis: {
      labels: { style: { colors: 'var(--color-secondary-foreground)', fontSize: '12px' } },
    },
    grid: { borderColor: 'var(--color-border)', strokeDashArray: 5 },
    tooltip: { theme: 'dark' },
  };
}

function firstDayOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const FILTER_DEFAULTS = { fromDate: firstDayOfMonth(), toDate: today() };

export function ExpenseTrendReportPage() {
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);

  const { data, isFetching, isError, refetch } = useExpenseTrendReport({
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  });

  const handleExport = () => {
    if (!data) return;
    exportReportToCsv(
      `expense-trend-${filters.fromDate}-to-${filters.toDate}`,
      [
        { header: 'Month', accessor: (m: ExpenseTrendMonthDto) => monthLabel(m) },
        { header: 'Amount', accessor: (m: ExpenseTrendMonthDto) => m.totalAmount },
      ],
      data.months,
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
        title="Expense Trend"
        crumbs={[{ label: 'Finance' }, { label: 'Reports' }, { label: 'Expense Trend' }]}
      />

      <Card className="mb-4" id="print-hide-on-print">
        <CardHeader>
          <CardHeading>
            <CardTitle>Filters</CardTitle>
          </CardHeading>
          <CardToolbar>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={!data?.months.length}>
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
        <ErrorState description="Couldn't load the expense trend report." onRetry={refetch} />
      ) : (
        <div id="print-root" className="space-y-4">
          {data && data.months.length > 0 && (
            <Card>
              <CardHeader>
                <CardHeading>
                  <CardTitle>Monthly expense trend</CardTitle>
                </CardHeading>
              </CardHeader>
              <div className="p-4">
                <ApexChart
                  options={buildTrendChartOptions(data.months.map((m) => monthLabel(m)))}
                  series={[{ name: 'Expenses', data: data.months.map((m) => Number(m.totalAmount)) }]}
                  type="bar"
                  height={300}
                />
              </div>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>
                  Expense Trend
                  {data ? ` — ${formatDate(data.metadata.fromDate ?? filters.fromDate)} to ${formatDate(data.metadata.toDate ?? filters.toDate)}` : ''}
                </CardTitle>
              </CardHeading>
              <CardToolbar>{isFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
            </CardHeader>
            <CardTable>
              {!isFetching && data?.months.length === 0 ? (
                <EmptyState title="No expenses" description="No expenses were recorded in this period." />
              ) : (
                <ScrollArea>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isFetching && !data ? (
                        <TableSkeleton columns={2} />
                      ) : (
                        (data?.months ?? []).map((month) => (
                          <TableRow key={`${month.year}-${month.month}`}>
                            <TableCell>{monthLabel(month)}</TableCell>
                            <TableCell>
                              <MoneyDisplay amount={month.totalAmount} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell className="font-medium">Total</TableCell>
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
