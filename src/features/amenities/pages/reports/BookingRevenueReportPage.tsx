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
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useBookingRevenueReport } from '../../api/reportsApi';

function firstDayOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const REVENUE_FILTER_DEFAULTS = { fromDate: firstDayOfMonth(), toDate: today() };
const REVENUE_COLUMN_COUNT = 4;

/**
 * Consumes the already-existing `GET /reports/facilities/booking-revenue` endpoint (Slice G) — every
 * amount shown is server-computed; nothing is summed across rows on this page (no fabricated grand
 * total from a partial/paginated view, per UX-4 §13).
 */
export function BookingRevenueReportPage() {
  const [filters, setFilters] = useUrlFilters(REVENUE_FILTER_DEFAULTS);

  const { data, isFetching, isError, refetch } = useBookingRevenueReport({
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  });

  return (
    <>
      <PageHeader title="Booking Revenue" crumbs={[{ label: 'Facilities' }, { label: 'Reports' }, { label: 'Booking Revenue' }]} />

      <Card className="mb-4">
        <CardHeader>
          <CardHeading>
            <CardTitle>Filters</CardTitle>
          </CardHeading>
        </CardHeader>
        <div className="flex flex-wrap gap-4 p-4">
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
          <ErrorState description="Failed to load the booking revenue report. Please try again." onRetry={refetch} />
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardHeading>
              <CardTitle>Revenue by Facility</CardTitle>
            </CardHeading>
            <CardToolbar>{isFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
          </CardHeader>
          <CardTable>
            {!isFetching && (data ?? []).length === 0 ? (
              <EmptyState title="No billable bookings in this period" description="Try widening the date range." />
            ) : (
              <ScrollArea>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Facility</TableHead>
                      <TableHead>Billable bookings</TableHead>
                      <TableHead>Booking charges</TableHead>
                      <TableHead>Deposits forfeited</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isFetching ? (
                      <TableSkeleton columns={REVENUE_COLUMN_COUNT} />
                    ) : (
                      (data ?? []).map((line) => (
                        <TableRow key={line.facilityId}>
                          <TableCell className="font-medium">{line.facilityName}</TableCell>
                          <TableCell>{line.billableBookingCount}</TableCell>
                          <TableCell><MoneyDisplay amount={line.totalBookingCharges} /></TableCell>
                          <TableCell><MoneyDisplay amount={line.totalDepositsForfeited} /></TableCell>
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
      )}
    </>
  );
}
