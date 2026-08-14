import { type ReactNode, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatDate, formatDateTime } from '@/lib/helpers';
import { PLATFORM_PERMISSIONS } from '@/lib/auth/platformPermissionKeys';
import { RequirePlatformPermission } from '@/lib/auth/RequirePlatformPermission';
import { EditOrganizationDialog } from '../components/EditOrganizationDialog';
import { OrganizationModulesEditDialog } from '../components/OrganizationModulesEditDialog';
import { moduleLabel } from '../lib/moduleKeys';
import { organizationStatusToneMap, type OrganizationStatus } from '../lib/organizationStatus';
import {
  useActivateOrganizationMutation,
  useGetOrganizationByIdQuery,
  useReactivateOrganizationMutation,
  useReplaceOrganizationModulesMutation,
  useSuspendOrganizationMutation,
  useUpdateOrganizationMutation,
} from '../api/platformOrganizationsApi';
import type { EditOrganizationSchemaType } from '../schemas/editOrganizationSchema';

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-border last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

type StatusAction = 'suspend' | 'activate' | 'reactivate' | null;

export function PlatformOrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: org, isLoading, isError, error, refetch } = useGetOrganizationByIdQuery(id!, { skip: !id });

  const [updateOrganization, { isLoading: isUpdating }] = useUpdateOrganizationMutation();
  const [replaceModules, { isLoading: isReplacingModules }] = useReplaceOrganizationModulesMutation();
  const [suspendOrganization, { isLoading: isSuspending }] = useSuspendOrganizationMutation();
  const [activateOrganization, { isLoading: isActivating }] = useActivateOrganizationMutation();
  const [reactivateOrganization, { isLoading: isReactivating }] = useReactivateOrganizationMutation();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isModulesOpen, setIsModulesOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<StatusAction>(null);
  const isChangingStatus = isSuspending || isActivating || isReactivating;

  if (!id) {
    navigate('/platform/dashboard', { replace: true });
    return null;
  }

  async function handleEditSubmit(values: EditOrganizationSchemaType) {
    try {
      await updateOrganization({ id: id!, body: { name: values.name, code: values.code || null } }).unwrap();
      toast.success('Organization updated.');
      setIsEditOpen(false);
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  async function handleModulesSubmit(moduleKeys: string[]) {
    try {
      await replaceModules({ id: id!, body: { moduleKeys } }).unwrap();
      toast.success('Enabled modules updated.');
      setIsModulesOpen(false);
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  async function handleConfirmStatusAction() {
    if (!statusAction) return;
    try {
      if (statusAction === 'suspend') {
        await suspendOrganization(id!).unwrap();
        toast.success('Organization suspended.');
      } else if (statusAction === 'activate') {
        await activateOrganization(id!).unwrap();
        toast.success('Organization activated.');
      } else {
        await reactivateOrganization(id!).unwrap();
        toast.success('Organization reactivated.');
      }
      setStatusAction(null);
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  if (isError) {
    return <ErrorState description={toUserMessage(error)} onRetry={refetch} />;
  }

  return (
    <>
      <PageHeader
        title={isLoading ? 'Loading…' : (org?.name ?? 'Organization')}
        crumbs={[
          { label: 'Dashboard', path: '/platform/dashboard' },
          { label: 'Organizations', path: '/platform/organizations' },
          { label: org?.name ?? 'Organization' },
        ]}
        secondaryActions={
          org && (
            <>
              <RequirePlatformPermission permission={PLATFORM_PERMISSIONS.organization.update}>
                <Button variant="outline" onClick={() => setIsEditOpen(true)}>
                  Edit
                </Button>
              </RequirePlatformPermission>
              {org.status === 'Active' && (
                <RequirePlatformPermission permission={PLATFORM_PERMISSIONS.organization.suspend}>
                  <Button variant="destructive" onClick={() => setStatusAction('suspend')}>
                    Suspend
                  </Button>
                </RequirePlatformPermission>
              )}
              {org.status === 'PendingActivation' && (
                <RequirePlatformPermission permission={PLATFORM_PERMISSIONS.organization.activate}>
                  <Button onClick={() => setStatusAction('activate')}>Activate</Button>
                </RequirePlatformPermission>
              )}
              {org.status === 'Suspended' && (
                <RequirePlatformPermission permission={PLATFORM_PERMISSIONS.organization.reactivate}>
                  <Button onClick={() => setStatusAction('reactivate')}>Reactivate</Button>
                </RequirePlatformPermission>
              )}
            </>
          )
        }
      />

      {org && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow label="Name" value={org.name} />
              <DetailRow label="Code" value={org.code ?? '—'} />
              <DetailRow label="Slug" value={org.slug} />
              <DetailRow
                label="Status"
                value={<StatusBadge status={org.status as OrganizationStatus} toneMap={organizationStatusToneMap} />}
              />
              <DetailRow label="Provisioned" value={formatDate(org.createdAtUtc)} />
              <DetailRow label="Last updated" value={org.updatedAtUtc ? formatDateTime(org.updatedAtUtc) : '—'} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Administrator</CardTitle>
            </CardHeader>
            <CardContent>
              {org.administrator ? (
                <>
                  <DetailRow label="Full name" value={org.administrator.fullName} />
                  <DetailRow label="Email" value={org.administrator.email} />
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No administrator on record for this organization.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Features</CardTitle>
              <RequirePlatformPermission permission={PLATFORM_PERMISSIONS.organization.featuresManage}>
                <Button variant="outline" size="sm" onClick={() => setIsModulesOpen(true)}>
                  Edit modules
                </Button>
              </RequirePlatformPermission>
            </CardHeader>
            <CardContent>
              {org.enabledModuleKeys.length === 0 ? (
                <p className="text-muted-foreground text-sm">No modules enabled.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {org.enabledModuleKeys.map((key) => (
                    <span key={key} className="rounded-md border px-2 py-1 text-xs">
                      {moduleLabel(key)}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {org && (
        <>
          <EditOrganizationDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            initialName={org.name}
            initialCode={org.code}
            isSubmitting={isUpdating}
            onSubmit={handleEditSubmit}
          />
          <OrganizationModulesEditDialog
            open={isModulesOpen}
            onOpenChange={setIsModulesOpen}
            initialModuleKeys={org.enabledModuleKeys}
            isSubmitting={isReplacingModules}
            onSubmit={handleModulesSubmit}
          />
        </>
      )}

      <ConfirmActionDialog
        open={statusAction !== null}
        onOpenChange={(open) => !open && setStatusAction(null)}
        title={
          statusAction === 'suspend'
            ? 'Suspend this organization?'
            : statusAction === 'activate'
              ? 'Activate this organization?'
              : 'Reactivate this organization?'
        }
        description={
          statusAction === 'suspend'
            ? "This organization's users will no longer be able to sign in. Its data is preserved and this can be reversed with Reactivate."
            : 'This organization will become Active and its users will be able to sign in.'
        }
        confirmLabel={
          statusAction === 'suspend' ? 'Suspend' : statusAction === 'activate' ? 'Activate' : 'Reactivate'
        }
        loadingLabel="Working…"
        isLoading={isChangingStatus}
        onConfirm={handleConfirmStatusAction}
      />
    </>
  );
}
