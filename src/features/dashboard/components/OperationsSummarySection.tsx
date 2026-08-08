import { skipToken } from '@reduxjs/toolkit/query/react';
import { Fuel, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardHeading, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/feedback/ErrorState';
import { KpiCard } from '@/components/shared/KpiCard';
import { useGeneratorMaintenanceDueReport } from '@/features/operations/api/reportsApi';
import { useCurrentStock } from '@/features/operations/api/cylinderStockApi';
import { formatNumber } from '@/lib/helpers';
import { hasPermission } from '@/lib/auth/permissions';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { useAppSelector } from '@/store/hooks';

/**
 * Generator maintenance-due and gas-cylinder stock are gated by two different permissions
 * (generator.report / gascylinder.view) — each KPI is fetched and shown independently, so a user
 * holding only one still sees that KPI rather than the whole section disappearing.
 */
export function OperationsSummarySection() {
  const user = useAppSelector((s) => s.auth.user);
  const canViewGenerator = hasPermission(user, PERMISSIONS.generator.report);
  const canViewCylinders = hasPermission(user, PERMISSIONS.gasCylinder.view);

  const maintenanceDue = useGeneratorMaintenanceDueReport(canViewGenerator ? undefined : skipToken);
  const stock = useCurrentStock(canViewCylinders ? {} : skipToken);

  if (!canViewGenerator && !canViewCylinders) {
    return null;
  }

  const dueCount = (maintenanceDue.data ?? []).filter((s) => s.isDue).length;
  const totalCylinderStock = (stock.data ?? []).reduce((sum, s) => sum + Number(s.currentStock), 0);

  const isError = (canViewGenerator && maintenanceDue.isError) || (canViewCylinders && stock.isError);
  const refetch = () => {
    if (canViewGenerator) void maintenanceDue.refetch();
    if (canViewCylinders) void stock.refetch();
  };

  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <CardTitle as="h2">Operations</CardTitle>
        </CardHeading>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState description="Couldn't load the operations summary." onRetry={refetch} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {canViewGenerator && (
              <KpiCard
                label="Generator maintenance due"
                value={dueCount}
                icon={Wrench}
                isLoading={maintenanceDue.isFetching}
                tone={dueCount > 0 ? 'destructive' : 'primary'}
              />
            )}
            {canViewCylinders && (
              <KpiCard
                label="Gas cylinder stock"
                value={formatNumber(totalCylinderStock, 0)}
                icon={Fuel}
                isLoading={stock.isFetching}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
