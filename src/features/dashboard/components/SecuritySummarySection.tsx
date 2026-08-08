import { skipToken } from '@reduxjs/toolkit/query/react';
import { Package, ShieldUser } from 'lucide-react';
import { Card, CardContent, CardHeader, CardHeading, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/feedback/ErrorState';
import { KpiCard } from '@/components/shared/KpiCard';
import { useSecuritySummaryReport } from '@/features/security/api/reportsApi';
import { hasPermission } from '@/lib/auth/permissions';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { useAppSelector } from '@/store/hooks';

/**
 * Tenant-wide only — AccessSession/Parcel have no BuildingId of their own (one front gate/desk serves
 * the whole property), matching the backend's own scope decision.
 */
export function SecuritySummarySection() {
  const user = useAppSelector((s) => s.auth.user);
  const canView = hasPermission(user, PERMISSIONS.report.securityView);

  const { data, isFetching, isError, refetch } = useSecuritySummaryReport(canView ? undefined : skipToken);

  if (!canView) {
    return null;
  }

  const currentlyInsideTotal = data?.currentlyInside.reduce((sum, c) => sum + Number(c.count), 0) ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <CardTitle as="h2">Security &amp; Front Desk</CardTitle>
        </CardHeading>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState description="Couldn't load the security summary." onRetry={refetch} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <KpiCard
              label="Currently inside"
              value={currentlyInsideTotal}
              icon={ShieldUser}
              isLoading={isFetching}
              caption={
                data && data.currentlyInside.length > 0
                  ? data.currentlyInside.map((c) => `${c.category}: ${c.count}`).join(' · ')
                  : undefined
              }
            />
            <KpiCard
              label="Parcels awaiting collection"
              value={data?.parcelsAwaitingCollectionCount ?? 0}
              icon={Package}
              isLoading={isFetching}
              tone={data && Number(data.parcelsAwaitingCollectionCount) > 0 ? 'warning' : 'primary'}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
