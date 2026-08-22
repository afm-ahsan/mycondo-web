import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { toApiError } from '@/lib/forms/applyApiErrorToForm';
import {
  useActivateTenantRegistration,
  useApproveTenantRegistrationByOwner,
  useHouseholdMembers,
  useMoveOutTenantRegistration,
  useRejectTenantRegistrationByManagement,
  useRejectTenantRegistrationByOwner,
  useRequestTenantRegistrationCorrectionsByManagement,
  useRequestTenantRegistrationCorrectionsByOwner,
  useTenantRegistration,
  useVerifyTenantRegistrationByManagement,
} from '../api/leasingApi';
import { PageHeader } from '@/components/shared/PageHeader';
import { ReasonDialog } from '@/components/shared/ReasonDialog';
import { StatusHistoryTimeline } from '../components/StatusHistoryTimeline';
import { WorkerVehicleAssignmentsSection } from '../components/WorkerVehicleAssignmentsSection';
import { tenantRegistrationStatusToneMap, type TenantRegistrationStatus } from '../lib/status';

type DialogKind = 'owner-reject' | 'owner-corrections' | 'management-reject' | 'management-corrections' | 'move-out' | null;

/**
 * Read-only registration summary plus the owner-review / management-verification / move-out actions
 * — the counterpart to the wizard, for everyone who isn't actively filling in the application
 * (owners, management, and anyone just viewing status).
 */
export function TenantRegistrationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const registrationId = id ?? '';

  const {
    data: registration,
    isLoading: isLoadingRegistration,
    isError: isRegistrationError,
    error: registrationError,
    refetch: refetchRegistration,
  } = useTenantRegistration({ id: registrationId });
  const { data: members } = useHouseholdMembers({ id: registrationId });

  const [approveByOwner, { isLoading: isApprovingOwner }] = useApproveTenantRegistrationByOwner();
  const [rejectByOwner, { isLoading: isRejectingOwner }] = useRejectTenantRegistrationByOwner();
  const [requestCorrectionsByOwner, { isLoading: isRequestingOwnerCorrections }] =
    useRequestTenantRegistrationCorrectionsByOwner();
  const [verifyByManagement, { isLoading: isVerifying }] = useVerifyTenantRegistrationByManagement();
  const [rejectByManagement, { isLoading: isRejectingManagement }] = useRejectTenantRegistrationByManagement();
  const [requestCorrectionsByManagement, { isLoading: isRequestingManagementCorrections }] =
    useRequestTenantRegistrationCorrectionsByManagement();
  const [activate, { isLoading: isActivating }] = useActivateTenantRegistration();
  const [moveOut, { isLoading: isMovingOut }] = useMoveOutTenantRegistration();

  const [dialog, setDialog] = useState<DialogKind>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    setError(null);
    try {
      await action();
      toast.success(successMessage);
    } catch (err) {
      setError(toUserMessage(toApiError(err) ?? err));
    }
  }

  async function handleReasonConfirm(reason: string) {
    setError(null);
    try {
      switch (dialog) {
        case 'owner-reject':
          await rejectByOwner({ id: registrationId, reasonRequest: { reason } }).unwrap();
          toast.success('Registration rejected.');
          break;
        case 'owner-corrections':
          await requestCorrectionsByOwner({ id: registrationId, reasonRequest: { reason } }).unwrap();
          toast.success('Corrections requested.');
          break;
        case 'management-reject':
          await rejectByManagement({ id: registrationId, reasonRequest: { reason } }).unwrap();
          toast.success('Registration rejected.');
          break;
        case 'management-corrections':
          await requestCorrectionsByManagement({ id: registrationId, reasonRequest: { reason } }).unwrap();
          toast.success('Corrections requested.');
          break;
        case 'move-out':
          await moveOut({ id: registrationId, moveOutRequest: { reason } }).unwrap();
          toast.success('Move-out recorded.');
          break;
      }
      setDialog(null);
    } catch (err) {
      setError(toUserMessage(toApiError(err) ?? err));
    }
  }

  if (isRegistrationError) {
    return (
      <ErrorState
        title="Couldn't load this registration"
        description={toUserMessage(registrationError)}
        onRetry={refetchRegistration}
      />
    );
  }

  if (isLoadingRegistration || !registration) {
    return <PageSkeleton />;
  }

  const activeMembers = members?.filter((m) => m.isActive) ?? [];
  const isDialogSubmitting =
    isRejectingOwner || isRequestingOwnerCorrections || isRejectingManagement || isRequestingManagementCorrections || isMovingOut;

  return (
    <>
      <PageHeader
        title={registration.primaryFullName}
        crumbs={[{ label: 'Tenant Registrations', path: '/leasing/tenant-registrations' }, { label: registration.primaryFullName }]}
        primaryAction={
          <>
            <Button variant="outline" asChild>
              <Link to={`/leasing/tenant-registrations/${registrationId}/print`}>Print</Link>
            </Button>
            {(registration.status === 'Draft' || registration.status === 'CorrectionsRequested') && (
              <RequirePermission permission={PERMISSIONS.occupancyRegistration.create}>
                <Button asChild>
                  <Link to={`/leasing/tenant-registrations/${registrationId}/edit`}>Continue Editing</Link>
                </Button>
              </RequirePermission>
            )}
          </>
        }
      />

      {error && (
        <Alert variant="destructive" appearance="light" className="mb-4" onClose={() => setError(null)}>
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                Registration Details
                <StatusBadge status={registration.status as TenantRegistrationStatus} toneMap={tenantRegistrationStatusToneMap} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-2">
                <Field label="Occupancy type">{registration.occupancyType}</Field>
                <Field label="Phone">{registration.primaryPhone ?? '—'}</Field>
                <Field label="Email">{registration.primaryEmail ?? '—'}</Field>
                <Field label="National ID">{registration.primaryNationalIdNumberMasked ?? '—'}</Field>
                <Field label="Date of birth">{registration.primaryDateOfBirth ?? '—'}</Field>
                <Field label="Religion">{registration.primaryReligion ?? '—'}</Field>
                <Field label="Nationality">{registration.primaryNationality ?? '—'}</Field>
                <Field label="Father's name">{registration.primaryFatherName ?? '—'}</Field>
                <Field label="Mother's name">{registration.primaryMotherName ?? '—'}</Field>
                <Field label="Marital status">{registration.primaryMaritalStatus ?? '—'}</Field>
                <Field label="Profession">{registration.primaryProfession ?? '—'}</Field>
                <Field label="Permanent address">{registration.primaryPermanentAddress ?? '—'}</Field>
                <Field label="Emergency contact">
                  {registration.emergencyContactName
                    ? `${registration.emergencyContactName}${registration.emergencyContactPhone ? ` (${registration.emergencyContactPhone})` : ''}`
                    : '—'}
                </Field>
                <Field label="Expected move-in">{registration.moveInExpectedDate ?? '—'}</Field>
                {registration.correctionsRequestedReason && (
                  <Field label="Corrections requested">{registration.correctionsRequestedReason}</Field>
                )}
                {registration.rejectedReason && <Field label="Rejection reason">{registration.rejectedReason}</Field>}
                {registration.moveOutReason && <Field label="Move-out reason">{registration.moveOutReason}</Field>}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Household Members</CardTitle>
            </CardHeader>
            <CardContent>
              {activeMembers.length === 0 ? (
                <p className="text-muted-foreground text-sm">None on file.</p>
              ) : (
                <ul className="space-y-2">
                  {activeMembers.map((m) => (
                    <li key={m.householdMemberId} className="flex items-center justify-between text-sm">
                      <span>{m.fullName}</span>
                      <Badge variant="secondary" appearance="light">
                        {m.relationshipToPrimary}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <WorkerVehicleAssignmentsSection registrationId={registrationId} />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {registration.status === 'Submitted' && (
                <RequirePermission permission={PERMISSIONS.occupancyRegistration.ownerReview}>
                  <Button disabled={isApprovingOwner} onClick={() => runAction(() => approveByOwner({ id: registrationId }).unwrap(), 'Approved.')}>
                    Approve
                  </Button>
                  <Button variant="outline" onClick={() => setDialog('owner-corrections')}>
                    Request Corrections
                  </Button>
                  <Button variant="destructive" onClick={() => setDialog('owner-reject')}>
                    Reject
                  </Button>
                </RequirePermission>
              )}

              {registration.status === 'OwnerApproved' && (
                <RequirePermission permission={PERMISSIONS.occupancyRegistration.verify}>
                  <Button disabled={isVerifying} onClick={() => runAction(() => verifyByManagement({ id: registrationId }).unwrap(), 'Verified.')}>
                    Verify
                  </Button>
                  <Button variant="outline" onClick={() => setDialog('management-corrections')}>
                    Request Corrections
                  </Button>
                  <Button variant="destructive" onClick={() => setDialog('management-reject')}>
                    Reject
                  </Button>
                </RequirePermission>
              )}

              {registration.status === 'ManagementVerified' && (
                <RequirePermission permission={PERMISSIONS.occupancyRegistration.verify}>
                  <Button disabled={isActivating} onClick={() => runAction(() => activate({ id: registrationId }).unwrap(), 'Occupancy activated.')}>
                    Activate (Move-in)
                  </Button>
                </RequirePermission>
              )}

              {registration.status === 'Active' && (
                <RequirePermission permission={PERMISSIONS.occupancyRegistration.moveOut}>
                  <Button variant="outline" onClick={() => setDialog('move-out')}>
                    Record Move-out
                  </Button>
                </RequirePermission>
              )}

              {!['Submitted', 'OwnerApproved', 'ManagementVerified', 'Active'].includes(registration.status) && (
                <p className="text-muted-foreground text-sm">No actions available for this status.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <StatusHistoryTimeline registrationId={registrationId} />
        </div>
      </div>

      <ReasonDialog
        open={dialog === 'owner-reject'}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Reject Registration"
        confirmLabel="Reject"
        confirmVariant="destructive"
        isSubmitting={isDialogSubmitting}
        onConfirm={handleReasonConfirm}
      />
      <ReasonDialog
        open={dialog === 'owner-corrections'}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Request Corrections"
        confirmLabel="Send Back"
        isSubmitting={isDialogSubmitting}
        onConfirm={handleReasonConfirm}
      />
      <ReasonDialog
        open={dialog === 'management-reject'}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Reject Registration"
        confirmLabel="Reject"
        confirmVariant="destructive"
        isSubmitting={isDialogSubmitting}
        onConfirm={handleReasonConfirm}
      />
      <ReasonDialog
        open={dialog === 'management-corrections'}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Request Corrections"
        confirmLabel="Send Back"
        isSubmitting={isDialogSubmitting}
        onConfirm={handleReasonConfirm}
      />
      <ReasonDialog
        open={dialog === 'move-out'}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Record Move-out"
        description="This deactivates every active household member, worker, and vehicle assignment on this registration."
        confirmLabel="Record Move-out"
        isSubmitting={isDialogSubmitting}
        onConfirm={handleReasonConfirm}
      />
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  );
}
