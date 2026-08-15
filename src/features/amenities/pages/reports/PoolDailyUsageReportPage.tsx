import { skipToken } from '@reduxjs/toolkit/query/react';
import { Card, CardContent, CardHeader, CardHeading, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Waves } from 'lucide-react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { FacilitySelect } from '@/components/shared/FacilitySelect';
import { PageHeader } from '@/components/shared/PageHeader';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { usePoolDailyUsageReport } from '../../api/reportsApi';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const POOL_USAGE_FILTER_DEFAULTS = { facilityId: '', date: today() };

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-muted-foreground text-xs">{label}</div>
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

/**
 * Consumes the already-existing `GET /reports/facilities/pool-daily-usage` endpoint (Slice G) — a
 * single pool + single day is required by the backend contract (not a range), so this is a summary
 * view rather than a table. All counts are server-computed.
 */
export function PoolDailyUsageReportPage() {
  const [filters, setFilters] = useUrlFilters(POOL_USAGE_FILTER_DEFAULTS);

  const { data, isFetching, isError, refetch } = usePoolDailyUsageReport(
    filters.facilityId ? { facilityId: filters.facilityId, date: filters.date } : skipToken,
  );

  return (
    <>
      <PageHeader title="Pool Daily Usage" crumbs={[{ label: 'Facilities' }, { label: 'Reports' }, { label: 'Pool Daily Usage' }]} />

      <Card className="mb-4">
        <CardHeader>
          <CardHeading>
            <CardTitle>Filters</CardTitle>
          </CardHeading>
        </CardHeader>
        <div className="flex flex-wrap gap-4 p-4">
          <div className="space-y-1 w-full sm:w-56">
            <Label>Pool</Label>
            <FacilitySelect
              facilityType="SwimmingPool"
              value={filters.facilityId || undefined}
              onValueChange={(id) => setFilters({ facilityId: id })}
              placeholder="Select a pool"
            />
          </div>
          <div className="space-y-1">
            <Label>Date</Label>
            <Input type="date" value={filters.date} onChange={(e) => setFilters({ date: e.target.value })} />
          </div>
        </div>
      </Card>

      {!filters.facilityId ? (
        <Card>
          <EmptyState
            icon={<Waves className="size-8" aria-hidden="true" />}
            title="No pool selected"
            description="Choose a pool above to see its daily usage summary."
          />
        </Card>
      ) : isError ? (
        <Card>
          <ErrorState description="Failed to load the daily usage report. Please try again." onRetry={refetch} />
        </Card>
      ) : isFetching || !data ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-4 w-20 animate-pulse rounded bg-muted mb-2" />
                <div className="h-7 w-12 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="Total entries" value={data.totalEntries} />
          <StatCard label="Peak concurrent occupancy" value={data.peakConcurrentOccupancy} />
          <StatCard label="Resident entries" value={data.residentEntries} />
          <StatCard label="Guest entries" value={data.guestEntries} />
          <StatCard label="Adult entries" value={data.adultEntries} />
          <StatCard label="Child entries" value={data.childEntries} />
        </div>
      )}
    </>
  );
}
