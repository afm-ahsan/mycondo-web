import type { ApexOptions } from 'apexcharts';
import ApexChart from 'react-apexcharts';
import { CalendarOff } from 'lucide-react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { FacilitySelect } from '@/components/shared/FacilitySelect';
import { PageHeader } from '@/components/shared/PageHeader';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useFacilityUtilizationReport } from '../../api/reportsApi';

function buildComparisonChartOptions(facilityNames: string[]): ApexOptions {
  return {
    chart: { type: 'bar', height: 280, toolbar: { show: false }, stacked: true },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
    dataLabels: { enabled: false },
    legend: { position: 'top', labels: { colors: 'var(--color-secondary-foreground)' } },
    colors: ['var(--color-success)', 'var(--color-destructive)', 'var(--color-warning)'],
    xaxis: {
      categories: facilityNames,
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

const UTILIZATION_FILTER_DEFAULTS = { facilityId: '', fromDate: firstDayOfMonth(), toDate: today() };
const UTILIZATION_COLUMN_COUNT = 5;

/**
 * Consumes the already-existing `GET /reports/facilities/utilization` endpoint (Slice G) — no new
 * backend work, per UX-4 §13. Every number shown is the server's own count, nothing summed or
 * derived client-side.
 */
export function FacilityUtilizationReportPage() {
  const [filters, setFilters] = useUrlFilters(UTILIZATION_FILTER_DEFAULTS);

  const { data, isFetching, isError, refetch } = useFacilityUtilizationReport({
    facilityId: filters.facilityId || undefined,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  });

  return (
    <>
      <PageHeader title="Facility Utilization" crumbs={[{ label: 'Facilities' }, { label: 'Reports' }, { label: 'Utilization' }]} />

      <Card className="mb-4">
        <CardHeader>
          <CardHeading>
            <CardTitle>Filters</CardTitle>
          </CardHeading>
        </CardHeader>
        <div className="flex flex-wrap gap-4 p-4">
          <div className="space-y-1 w-full sm:w-56">
            <Label>Facility (optional)</Label>
            <FacilitySelect
              value={filters.facilityId || undefined}
              onValueChange={(id) => setFilters({ facilityId: id })}
              placeholder="All facilities"
            />
          </div>
          <div className="space-y-1">
            <Label>From</Label>
            <Input type="date" value={filters.fromDate} onChange={(e) => setFilters({ fromDate: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>To</Label>
            <Input type="date" value={filters.toDate} onChange={(e) => setFilters({ toDate: e.target.value })} />
          </div>
        </div>
      </Card>

      {isError ? (
        <Card>
          <ErrorState description="Failed to load the utilization report. Please try again." onRetry={refetch} />
        </Card>
      ) : (
        <div className="space-y-4">
          {!isFetching && (data ?? []).length > 1 && (
            <Card>
              <CardHeader>
                <CardHeading>
                  <CardTitle>Utilization comparison</CardTitle>
                </CardHeading>
              </CardHeader>
              <div className="p-4">
                <ApexChart
                  options={buildComparisonChartOptions((data ?? []).map((l) => l.facilityName))}
                  series={[
                    { name: 'Completed', data: (data ?? []).map((l) => Number(l.completedBookings)) },
                    { name: 'Cancelled', data: (data ?? []).map((l) => Number(l.cancelledBookings)) },
                    { name: 'No-show', data: (data ?? []).map((l) => Number(l.noShowBookings)) },
                  ]}
                  type="bar"
                  height={280}
                />
              </div>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Bookings by Facility</CardTitle>
              </CardHeading>
              <CardToolbar>{isFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
            </CardHeader>
            <CardTable>
              {!isFetching && (data ?? []).length === 0 ? (
                <EmptyState
                  icon={<CalendarOff className="size-8" aria-hidden="true" />}
                  title="No bookings in this period"
                  description="Try widening the date range or clearing the facility filter."
                />
              ) : (
                <ScrollArea>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Facility</TableHead>
                        <TableHead>Total bookings</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Cancelled</TableHead>
                        <TableHead>No-show</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isFetching ? (
                        <TableSkeleton columns={UTILIZATION_COLUMN_COUNT} />
                      ) : (
                        (data ?? []).map((line) => (
                          <TableRow key={line.facilityId}>
                            <TableCell className="font-medium">{line.facilityName}</TableCell>
                            <TableCell>{line.totalBookings}</TableCell>
                            <TableCell>{line.completedBookings}</TableCell>
                            <TableCell>{line.cancelledBookings}</TableCell>
                            <TableCell>{line.noShowBookings}</TableCell>
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
        </div>
      )}
    </>
  );
}
