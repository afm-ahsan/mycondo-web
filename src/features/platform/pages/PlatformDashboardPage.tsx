import { Building2, CheckCircle2, PauseCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toUserMessage } from '@/api/errors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { InlineSpinner } from '@/components/feedback/InlineSpinner';
import { KpiCard } from '@/components/shared/KpiCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatDate } from '@/lib/helpers';
import { PLATFORM_PERMISSIONS } from '@/lib/auth/platformPermissionKeys';
import { RequirePlatformPermission } from '@/lib/auth/RequirePlatformPermission';
import { useAppSelector } from '@/store/hooks';
import { useGetOrganizationSummaryStatsQuery, useListOrganizationsQuery } from '../api/platformOrganizationsApi';
import { organizationStatusToneMap, type OrganizationStatus } from '../lib/organizationStatus';

const RECENT_ORGANIZATIONS_COUNT = 5;

export function PlatformDashboardPage() {
  const user = useAppSelector((s) => s.platformAuth.user);

  const { data: stats, isLoading: isStatsLoading } = useGetOrganizationSummaryStatsQuery();
  const {
    data: recentPage,
    isLoading: isRecentLoading,
    isError: isRecentError,
    error: recentError,
    refetch: refetchRecent,
  } = useListOrganizationsQuery({ page: 1, pageSize: RECENT_ORGANIZATIONS_COUNT });

  const recentOrganizations = recentPage?.items ?? [];

  return (
    <>
      <PageHeader
        title="Platform Administration"
        description={`Signed in as ${user?.displayName} (${user?.email})`}
      />

      <div className="grid grid-cols-2 gap-4 mb-4 sm:grid-cols-4">
        <KpiCard label="Total organizations" value={stats?.total ?? 0} icon={Building2} isLoading={isStatsLoading} />
        <KpiCard label="Active" value={stats?.active ?? 0} icon={CheckCircle2} tone="success" isLoading={isStatsLoading} />
        <KpiCard label="Suspended" value={stats?.suspended ?? 0} icon={PauseCircle} tone="destructive" isLoading={isStatsLoading} />
        <KpiCard label="Created this week" value={stats?.recentlyCreated ?? 0} icon={Sparkles} tone="info" isLoading={isStatsLoading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recently added organizations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {isRecentError && <ErrorState description={toUserMessage(recentError)} onRetry={refetchRecent} />}

          {!isRecentError && isRecentLoading && (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <InlineSpinner /> Loading…
            </div>
          )}

          {!isRecentError && !isRecentLoading && recentOrganizations.length === 0 && (
            <EmptyState title="No organizations yet" description="Organizations you provision will appear here." />
          )}

          {!isRecentError &&
            !isRecentLoading &&
            recentOrganizations.map((org) => (
              <Link
                key={org.tenantId}
                to={`/platform/organizations/${org.tenantId}`}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-2.5 -mx-2 hover:bg-muted"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {org.name}
                    {org.code && <span className="text-muted-foreground ml-1.5 text-xs">({org.code})</span>}
                  </div>
                  <div className="text-muted-foreground text-xs">Created {formatDate(org.createdAtUtc)}</div>
                </div>
                <StatusBadge status={org.status as OrganizationStatus} toneMap={organizationStatusToneMap} />
              </Link>
            ))}
        </CardContent>
        <CardFooter className="justify-between">
          <Button asChild variant="outline" size="sm">
            <Link to="/platform/organizations">View all organizations</Link>
          </Button>
          <RequirePlatformPermission permission={PLATFORM_PERMISSIONS.organization.create}>
            <Button asChild size="sm">
              <Link to="/platform/organizations/new">New Organization</Link>
            </Button>
          </RequirePlatformPermission>
        </CardFooter>
      </Card>
    </>
  );
}
