import type { ApexOptions } from 'apexcharts';
import { Printer } from 'lucide-react';
import ApexChart from 'react-apexcharts';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardHeading,
  CardTable,
  CardTitle,
  CardToolbar,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { formatDate } from '@/lib/helpers';
import { useReceivablesAgeingReport } from '../api/reportsApi';

function buildAgeingChartOptions(bucketLabels: string[]): ApexOptions {
  return {
    chart: { type: 'bar', height: 260, toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%', distributed: true } },
    dataLabels: { enabled: false },
    legend: { show: false },
    colors: ['var(--color-success)', 'var(--color-info)', 'var(--color-primary)', 'var(--color-warning)', 'var(--color-destructive)'],
    xaxis: {
      categories: bucketLabels,
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

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const FILTER_DEFAULTS = { buildingId: '', asOfDate: today() };

export function ReceivablesAgeingReportPage() {
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);

  const { data, isFetching, isError, refetch } = useReceivablesAgeingReport({
    buildingId: filters.buildingId || undefined,
    asOfDate: filters.asOfDate,
  });

  return (
    <>
      {/* Print-only: everything outside #print-root (sidebar, header, filter inputs) is hidden via
          this page-local override — same pattern as TenantRegistrationPrintPage. No PDF library or
          export architecture involved, just the browser's own print pipeline. */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-root, #print-root * { visibility: visible; }
          #print-root { position: absolute; inset: 0; width: 100%; margin: 0; padding: 0; }
          #print-hide-on-print { display: none !important; }
        }
      `}</style>

      <PageHeader
        title="Receivables Ageing"
        crumbs={[{ label: 'Finance' }, { label: 'Reports' }, { label: 'Receivables Ageing' }]}
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
          <div className="space-y-1 w-full sm:w-56">
            <Label>Building</Label>
            <BuildingSelect
              value={filters.buildingId || undefined}
              onValueChange={(v) => setFilters({ buildingId: v })}
              placeholder="All buildings"
            />
          </div>
          <div className="space-y-1">
            <Label>As of</Label>
            <Input type="date" value={filters.asOfDate} onChange={(e) => setFilters({ asOfDate: e.target.value })} />
          </div>
        </div>
      </Card>

      {isError ? (
        <ErrorState description="Couldn't load the receivables ageing report." onRetry={refetch} />
      ) : (
        <div id="print-root" className="space-y-4">
          {data && data.buckets.length > 0 && (
            <Card>
              <CardHeader>
                <CardHeading>
                  <CardTitle>Ageing distribution</CardTitle>
                </CardHeading>
              </CardHeader>
              <div className="p-4">
                <ApexChart
                  options={buildAgeingChartOptions(data.buckets.map((b) => b.bucketLabel))}
                  series={[{ name: 'Outstanding balance', data: data.buckets.map((b) => Number(b.totalBalance)) }]}
                  type="bar"
                  height={260}
                />
              </div>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Outstanding balance by age{data ? ` — as of ${formatDate(data.asOfDate)}` : ''}</CardTitle>
              </CardHeading>
              <CardToolbar>{isFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
            </CardHeader>
            <CardTable>
              <ScrollArea>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Age bucket</TableHead>
                      <TableHead>Invoices</TableHead>
                      <TableHead>Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isFetching && !data ? (
                      <TableSkeleton columns={3} />
                    ) : (data?.buckets ?? []).map((bucket) => (
                      <TableRow key={bucket.bucketLabel}>
                        <TableCell>{bucket.bucketLabel}</TableCell>
                        <TableCell>{bucket.invoiceCount}</TableCell>
                        <TableCell>
                          <MoneyDisplay amount={bucket.totalBalance} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-medium">Total outstanding</TableCell>
                      <TableCell />
                      <TableCell className="font-medium">
                        <MoneyDisplay amount={data?.grandTotal} />
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardTable>
          </Card>
        </div>
      )}
    </>
  );
}
