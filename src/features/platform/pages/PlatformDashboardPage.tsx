import { useState } from 'react';
import { Building2, CheckCircle2, PauseCircle, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import { setPlatformAccessToken } from '@/api/platformBaseApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { KpiCard } from '@/components/shared/KpiCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { formatDate } from '@/lib/helpers';
import { PLATFORM_PERMISSIONS } from '@/lib/auth/platformPermissionKeys';
import { RequirePlatformPermission } from '@/lib/auth/RequirePlatformPermission';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { platformSessionEnded } from '@/store/slices/platformAuthSlice';
import {
  useActivateOrganizationMutation,
  useGetOrganizationSummaryStatsQuery,
  useListOrganizationsQuery,
  useReactivateOrganizationMutation,
  useSuspendOrganizationMutation,
} from '../api/platformOrganizationsApi';
import { usePlatformLogout } from '../api/platformAuthApi';
import { organizationStatusToneMap, type OrganizationStatus } from '../lib/organizationStatus';

const ORGANIZATIONS_COLUMN_COUNT = 6;
const PAGE_SIZE = 20;

type PendingAction =
  | { type: 'suspend' | 'activate' | 'reactivate'; organizationId: string; organizationName: string }
  | null;

export function PlatformDashboardPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.platformAuth.user);
  const [logout, { isLoading: isLoggingOut }] = usePlatformLogout();

  const { data: stats, isLoading: isStatsLoading } = useGetOrganizationSummaryStatsQuery();
  const {
    data: page,
    isLoading: isListLoading,
    isError: isListError,
    error: listError,
    refetch: refetchList,
  } = useListOrganizationsQuery({ page: 1, pageSize: PAGE_SIZE });

  const [suspendOrganization, { isLoading: isSuspending }] = useSuspendOrganizationMutation();
  const [activateOrganization, { isLoading: isActivating }] = useActivateOrganizationMutation();
  const [reactivateOrganization, { isLoading: isReactivating }] = useReactivateOrganizationMutation();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const isMutating = isSuspending || isActivating || isReactivating;

  async function handleLogout() {
    try {
      await logout().unwrap();
    } finally {
      setPlatformAccessToken(null);
      dispatch(platformSessionEnded());
      navigate('/platform/login');
    }
  }

  async function handleConfirmAction() {
    if (!pendingAction) return;
    try {
      if (pendingAction.type === 'suspend') {
        await suspendOrganization(pendingAction.organizationId).unwrap();
        toast.success(`${pendingAction.organizationName} suspended.`);
      } else if (pendingAction.type === 'activate') {
        await activateOrganization(pendingAction.organizationId).unwrap();
        toast.success(`${pendingAction.organizationName} activated.`);
      } else {
        await reactivateOrganization(pendingAction.organizationId).unwrap();
        toast.success(`${pendingAction.organizationName} reactivated.`);
      }
      setPendingAction(null);
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  const organizations = page?.items ?? [];

  return (
    <>
      <PageHeader
        title="Platform Administration"
        description={`Signed in as ${user?.displayName} (${user?.email})`}
        primaryAction={
          <RequirePlatformPermission permission={PLATFORM_PERMISSIONS.organization.create}>
            <Button asChild>
              <Link to="/platform/organizations/new">New Organization</Link>
            </Button>
          </RequirePlatformPermission>
        }
        secondaryActions={
          <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut}>
            Sign out
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 mb-4 sm:grid-cols-4">
        <KpiCard label="Total organizations" value={stats?.total ?? 0} icon={Building2} isLoading={isStatsLoading} />
        <KpiCard label="Active" value={stats?.active ?? 0} icon={CheckCircle2} tone="success" isLoading={isStatsLoading} />
        <KpiCard label="Suspended" value={stats?.suspended ?? 0} icon={PauseCircle} tone="destructive" isLoading={isStatsLoading} />
        <KpiCard label="Created this week" value={stats?.recentlyCreated ?? 0} icon={Sparkles} tone="info" isLoading={isStatsLoading} />
      </div>

      <Card>
        <CardContent>
          {isListError && <ErrorState description={toUserMessage(listError)} onRetry={refetchList} />}

          {!isListError && !isListLoading && organizations.length === 0 && (
            <EmptyState
              title="No organizations yet"
              description="Organizations you provision will appear here."
            />
          )}

          {!isListError && (isListLoading || organizations.length > 0) && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Administrator</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isListLoading ? (
                  <TableSkeleton columns={ORGANIZATIONS_COLUMN_COUNT} />
                ) : (
                  organizations.map((org) => (
                    <TableRow key={org.tenantId}>
                      <TableCell>
                        <Link to={`/platform/organizations/${org.tenantId}`} className="font-medium hover:underline">
                          {org.name}
                        </Link>
                        {org.code && <span className="text-muted-foreground ml-1.5 text-xs">({org.code})</span>}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={org.status as OrganizationStatus} toneMap={organizationStatusToneMap} />
                      </TableCell>
                      <TableCell>
                        {org.primaryAdministratorFullName ? (
                          <div className="text-sm">
                            <div>{org.primaryAdministratorFullName}</div>
                            <div className="text-muted-foreground text-xs">{org.primaryAdministratorEmail}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(org.createdAtUtc)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" appearance="light">
                          {org.enabledModuleCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link to={`/platform/organizations/${org.tenantId}`}>View</Link>
                          </Button>
                          {org.status === 'Active' && (
                            <RequirePlatformPermission permission={PLATFORM_PERMISSIONS.organization.suspend}>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={isMutating}
                                onClick={() =>
                                  setPendingAction({ type: 'suspend', organizationId: org.tenantId, organizationName: org.name })
                                }
                              >
                                Suspend
                              </Button>
                            </RequirePlatformPermission>
                          )}
                          {org.status === 'PendingActivation' && (
                            <RequirePlatformPermission permission={PLATFORM_PERMISSIONS.organization.activate}>
                              <Button
                                size="sm"
                                disabled={isMutating}
                                onClick={() =>
                                  setPendingAction({ type: 'activate', organizationId: org.tenantId, organizationName: org.name })
                                }
                              >
                                Activate
                              </Button>
                            </RequirePlatformPermission>
                          )}
                          {org.status === 'Suspended' && (
                            <RequirePlatformPermission permission={PLATFORM_PERMISSIONS.organization.reactivate}>
                              <Button
                                size="sm"
                                disabled={isMutating}
                                onClick={() =>
                                  setPendingAction({ type: 'reactivate', organizationId: org.tenantId, organizationName: org.name })
                                }
                              >
                                Reactivate
                              </Button>
                            </RequirePlatformPermission>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={
          pendingAction?.type === 'suspend'
            ? 'Suspend this organization?'
            : pendingAction?.type === 'activate'
              ? 'Activate this organization?'
              : 'Reactivate this organization?'
        }
        description={
          pendingAction?.type === 'suspend'
            ? `${pendingAction.organizationName}'s users will no longer be able to sign in. Its data is preserved and this can be reversed with Reactivate.`
            : `${pendingAction?.organizationName ?? 'This organization'} will become Active and its users will be able to sign in.`
        }
        confirmLabel={
          pendingAction?.type === 'suspend' ? 'Suspend' : pendingAction?.type === 'activate' ? 'Activate' : 'Reactivate'
        }
        loadingLabel="Working…"
        isLoading={isMutating}
        onConfirm={handleConfirmAction}
      />
    </>
  );
}
