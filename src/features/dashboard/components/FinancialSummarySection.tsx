import { skipToken } from '@reduxjs/toolkit/query/react';
import { AlertTriangle, Receipt, TrendingUp, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardHeading, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/feedback/ErrorState';
import { KpiCard } from '@/components/shared/KpiCard';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { useFinancialSummaryReport } from '@/features/payments/api/reportsApi';
import { formatDate } from '@/lib/helpers';
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
 * TotalBilled/TotalCollected are this-month period-flow figures; TotalOutstanding and Overdue are a
 * current snapshot (AsOfDate), never constrained to the month — the two captions below keep that
 * distinction visible rather than presenting all four numbers as if they shared one basis.
 */
export function FinancialSummarySection() {
  const user = useAppSelector((s) => s.auth.user);
  const canView = hasPermission(user, PERMISSIONS.report.financialView);

  const { data, isFetching, isError, refetch } = useFinancialSummaryReport(
    canView ? { fromDate: firstDayOfMonth(), toDate: today() } : skipToken,
  );

  if (!canView) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <CardTitle as="h2">Financial</CardTitle>
        </CardHeading>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState description="Couldn't load the financial summary." onRetry={refetch} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Billed this month"
              value={<MoneyDisplay amount={data?.totalBilled} />}
              icon={Receipt}
              isLoading={isFetching}
            />
            <KpiCard
              label="Collected this month"
              value={<MoneyDisplay amount={data?.totalCollected} />}
              icon={TrendingUp}
              isLoading={isFetching}
              tone="success"
            />
            <KpiCard
              label="Outstanding"
              value={<MoneyDisplay amount={data?.totalOutstanding} />}
              icon={Wallet}
              isLoading={isFetching}
              tone="warning"
              caption={data ? `As of ${formatDate(data.asOfDate)} — not month-limited` : undefined}
            />
            <KpiCard
              label="Overdue invoices"
              value={data?.overdueInvoiceCount ?? 0}
              icon={AlertTriangle}
              isLoading={isFetching}
              tone={data && Number(data.overdueInvoiceCount) > 0 ? 'destructive' : 'primary'}
              caption={data ? `As of ${formatDate(data.asOfDate)}` : undefined}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
