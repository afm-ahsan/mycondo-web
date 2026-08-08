import { skipToken } from '@reduxjs/toolkit/query/react';
import { AlertTriangle, CalendarCheck, ShieldUser, Wallet } from 'lucide-react';
import { KpiCard } from '@/components/shared/KpiCard';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { useFacilityUtilizationReport } from '@/features/amenities/api/reportsApi';
import { useFinancialSummaryReport } from '@/features/payments/api/reportsApi';
import { useSecuritySummaryReport } from '@/features/security/api/reportsApi';
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
 * A frontend composition, not its own backend endpoint — every value here is read from the same RTK
 * Query cache entry the module section below it also reads (identical args), so this never issues an
 * extra request; it's a second view of data already being fetched.
 */
export function ExecutiveSummarySection() {
  const user = useAppSelector((s) => s.auth.user);
  const canViewFinancial = hasPermission(user, PERMISSIONS.report.financialView);
  const canViewSecurity = hasPermission(user, PERMISSIONS.report.securityView);
  const canViewFacility = hasPermission(user, PERMISSIONS.report.facility);

  const financial = useFinancialSummaryReport(
    canViewFinancial ? { fromDate: firstDayOfMonth(), toDate: today() } : skipToken,
  );
  const security = useSecuritySummaryReport(canViewSecurity ? undefined : skipToken);
  const utilization = useFacilityUtilizationReport(
    canViewFacility ? { fromDate: firstDayOfMonth(), toDate: today() } : skipToken,
  );

  if (!canViewFinancial && !canViewSecurity && !canViewFacility) {
    return null;
  }

  const currentlyInsideTotal = security.data?.currentlyInside.reduce((sum, c) => sum + c.count, 0) ?? 0;
  const totalBookings = (utilization.data ?? []).reduce((sum, l) => sum + Number(l.totalBookings), 0);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {canViewFinancial && (
        <>
          <KpiCard
            label="Outstanding receivables"
            value={<MoneyDisplay amount={financial.data?.totalOutstanding} />}
            icon={Wallet}
            isLoading={financial.isFetching}
            tone="warning"
          />
          <KpiCard
            label="Overdue invoices"
            value={financial.data?.overdueInvoiceCount ?? 0}
            icon={AlertTriangle}
            isLoading={financial.isFetching}
            tone={financial.data && financial.data.overdueInvoiceCount > 0 ? 'destructive' : 'primary'}
          />
        </>
      )}
      {canViewSecurity && (
        <KpiCard
          label="Currently inside"
          value={currentlyInsideTotal}
          icon={ShieldUser}
          isLoading={security.isFetching}
        />
      )}
      {canViewFacility && (
        <KpiCard label="Bookings this month" value={totalBookings} icon={CalendarCheck} isLoading={utilization.isFetching} />
      )}
    </div>
  );
}
