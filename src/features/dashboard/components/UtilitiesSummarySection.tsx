import { skipToken } from '@reduxjs/toolkit/query/react';
import { ClipboardList, Flame, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardHeading, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/feedback/ErrorState';
import { KpiCard } from '@/components/shared/KpiCard';
import { formatNumber } from '@/lib/helpers';
import { useConsumptionSummaryReport, useReadingStatusSummaryReport } from '@/features/utilities/api/reportsApi';
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

// Mirrors ReadingStatusReportPage's own UNBILLED_STATUSES definition (everything except Billed) —
// same "Billed vs Unbilled" vocabulary used there, not a separate concept invented for this widget.
const UNBILLED_STATUSES = new Set(['Draft', 'Reviewed', 'Finalized', 'Corrected']);

export function UtilitiesSummarySection() {
  const user = useAppSelector((s) => s.auth.user);
  const canView = hasPermission(user, PERMISSIONS.utility.report);

  const consumption = useConsumptionSummaryReport(
    canView ? { fromDate: firstDayOfMonth(), toDate: today() } : skipToken,
  );
  const status = useReadingStatusSummaryReport(canView ? {} : skipToken);

  if (!canView) {
    return null;
  }

  const electricity = consumption.data?.find((l) => l.utilityType === 'Electricity');
  const gas = consumption.data?.find((l) => l.utilityType === 'Gas');
  const unbilledCount = (status.data ?? [])
    .filter((l) => UNBILLED_STATUSES.has(l.status))
    .reduce((sum, l) => sum + l.count, 0);

  const isFetching = consumption.isFetching || status.isFetching;
  const isError = consumption.isError || status.isError;
  const refetch = () => {
    void consumption.refetch();
    void status.refetch();
  };

  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <CardTitle>Utilities</CardTitle>
        </CardHeading>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState description="Couldn't load the utilities summary." onRetry={refetch} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard
              label="Electricity this month"
              value={`${formatNumber(electricity?.totalConsumptionUnits ?? 0, 0)} kWh`}
              icon={Zap}
              isLoading={isFetching}
              caption={electricity ? `${electricity.readingCount} readings` : undefined}
            />
            <KpiCard
              label="Gas this month"
              value={formatNumber(gas?.totalConsumptionUnits ?? 0, 0)}
              icon={Flame}
              isLoading={isFetching}
              caption={gas ? `${gas.readingCount} readings` : undefined}
            />
            <KpiCard
              label="Unbilled readings"
              value={unbilledCount}
              icon={ClipboardList}
              isLoading={isFetching}
              tone={unbilledCount > 0 ? 'warning' : 'primary'}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
