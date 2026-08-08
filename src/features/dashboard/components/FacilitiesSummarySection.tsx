import { skipToken } from '@reduxjs/toolkit/query/react';
import { CalendarCheck, Landmark } from 'lucide-react';
import { Card, CardContent, CardHeader, CardHeading, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/feedback/ErrorState';
import { KpiCard } from '@/components/shared/KpiCard';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { useBookingRevenueReport, useFacilityUtilizationReport } from '@/features/amenities/api/reportsApi';
import { hasPermission } from '@/lib/auth/permissions';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { useAppSelector } from '@/store/hooks';

function firstDayOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Both source reports return the complete unpaginated set of facilities for the tenant (no page
 * limit) — summing across that full array is an exact total, not an approximation from a partial
 * fetch, same identity as ReadingStatusReportPage's "Unbilled = Total − Billed".
 */
export function FacilitiesSummarySection() {
  const user = useAppSelector((s) => s.auth.user);
  const canView = hasPermission(user, PERMISSIONS.report.facility);

  const revenue = useBookingRevenueReport(canView ? { fromDate: firstDayOfMonth(), toDate: today() } : skipToken);
  const utilization = useFacilityUtilizationReport(
    canView ? { fromDate: firstDayOfMonth(), toDate: today() } : skipToken,
  );

  if (!canView) {
    return null;
  }

  const totalBookings = (utilization.data ?? []).reduce((sum, l) => sum + Number(l.totalBookings), 0);
  const totalRevenue = (revenue.data ?? []).reduce((sum, l) => sum + Number(l.totalBookingCharges), 0);

  const isFetching = revenue.isFetching || utilization.isFetching;
  const isError = revenue.isError || utilization.isError;
  const refetch = () => {
    void revenue.refetch();
    void utilization.refetch();
  };

  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <CardTitle as="h2">Facilities</CardTitle>
        </CardHeading>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState description="Couldn't load the facilities summary." onRetry={refetch} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <KpiCard label="Bookings this month" value={totalBookings} icon={CalendarCheck} isLoading={isFetching} />
            <KpiCard
              label="Booking revenue this month"
              value={<MoneyDisplay amount={totalRevenue} />}
              icon={Landmark}
              isLoading={isFetching}
              tone="success"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
