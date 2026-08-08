import { useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { AlertTriangle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { formatDateTime } from '@/lib/helpers';
import { toApiError } from '@/lib/forms/applyApiErrorToForm';
import {
  useApproveBooking,
  useBooking,
  useCancelBooking,
  useCheckInBooking,
  useCompleteBooking,
  useConfirmBookingPayment,
  useInspectBooking,
  useMarkBookingNoShow,
  useRejectBooking,
  useSubmitBooking,
} from '../../api/bookingsApi';
import { useFacility } from '../../api/facilitiesApi';
import { ApprovalTimeline } from '../../components/ApprovalTimeline';
import { BookingStatusBadge } from '../../components/BookingStatusBadge';
import { DepositSummaryPanel } from '../../components/DepositSummaryPanel';
import { InspectBookingDialog } from '../../components/InspectBookingDialog';
import { InspectionPanel } from '../../components/InspectionPanel';
import { OverrideReasonDialog } from '../../components/OverrideReasonDialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { PaymentStatusBadge } from '../../components/PaymentStatusBadge';
import { formatBdt } from '@/lib/helpers';
import type { BookingStatus } from '../../lib/bookingStatus';

type DialogKind = 'reject' | 'cancel' | 'inspect' | null;

/**
 * Every action button is rendered only for the BookingStatus values Booking.cs actually allows for
 * that transition (mirrors the backend's own transition table — see Slice G plan §5) — an invalid
 * action is never offered, not just disabled.
 */
export function BookingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: booking, isLoading, isError, error } = useBooking(id ? { id } : skipToken);
  const { data: facility } = useFacility(booking ? { id: booking.facilityId } : skipToken);

  const [submitBooking, { isLoading: isSubmitting }] = useSubmitBooking();
  const [approveBooking, { isLoading: isApproving }] = useApproveBooking();
  const [rejectBooking, { isLoading: isRejecting }] = useRejectBooking();
  const [confirmPayment, { isLoading: isConfirming }] = useConfirmBookingPayment();
  const [checkInBooking, { isLoading: isCheckingIn }] = useCheckInBooking();
  const [completeBooking, { isLoading: isCompleting }] = useCompleteBooking();
  const [inspectBooking, { isLoading: isInspecting }] = useInspectBooking();
  const [cancelBooking, { isLoading: isCancelling }] = useCancelBooking();
  const [markNoShow, { isLoading: isMarkingNoShow }] = useMarkBookingNoShow();

  const [dialog, setDialog] = useState<DialogKind>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!id) return null;
  if (isLoading) return <LoadingSpinner />;
  if (isError || !booking) {
    return (
      <Alert variant="destructive" appearance="light">
        <AlertIcon>
          <AlertTriangle />
        </AlertIcon>
        <AlertTitle>{toUserMessage(toApiError(error) ?? error)}</AlertTitle>
      </Alert>
    );
  }

  const status = booking.status as BookingStatus;

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    setActionError(null);
    try {
      await action();
      toast.success(successMessage);
    } catch (err) {
      setActionError(toUserMessage(toApiError(err) ?? err));
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Booking ${booking.bookingId.slice(0, 8)}`}
        crumbs={[
          { label: 'Facilities' },
          { label: 'Community Hall', path: '../bookings' },
          { label: booking.bookingId.slice(0, 8) },
        ]}
        primaryAction={
          <div className="flex items-center gap-2">
            <BookingStatusBadge status={status} />
            <PaymentStatusBadge booking={booking} />
          </div>
        }
      />

      {actionError && (
        <Alert variant="destructive" appearance="light" onClose={() => setActionError(null)}>
          <AlertIcon>
            <AlertTriangle />
          </AlertIcon>
          <AlertTitle>{actionError}</AlertTitle>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{facility?.name ?? 'Facility'} — {booking.eventType}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Start" value={formatDateTime(booking.startAtUtc)} />
            <Field label="End" value={formatDateTime(booking.endAtUtc)} />
            <Field label="Expected guests" value={String(booking.expectedGuestCount)} />
            <Field label="Booking charge" value={formatBdt(booking.bookingChargeAmount)} />
            <Field label="Deposit" value={formatBdt(booking.depositAmount)} />
            <Field
              label="Terms accepted"
              value={booking.termsAcceptedAtUtc ? formatDateTime(booking.termsAcceptedAtUtc) : 'Not recorded'}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <DepositSummaryPanel booking={booking} />
          <InspectionPanel booking={booking} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {status === 'Draft' && (
            <RequirePermission permission={PERMISSIONS.facility.bookingCreate}>
              <Button disabled={isSubmitting} onClick={() => runAction(() => submitBooking({ id }).unwrap(), 'Booking submitted.')}>
                Submit
              </Button>
            </RequirePermission>
          )}
          {status === 'PendingApproval' && (
            <RequirePermission permission={PERMISSIONS.facility.bookingApprove}>
              <Button disabled={isApproving} onClick={() => runAction(() => approveBooking({ id }).unwrap(), 'Booking approved.')}>
                Approve
              </Button>
              <Button variant="destructive" onClick={() => setDialog('reject')}>
                Reject
              </Button>
            </RequirePermission>
          )}
          {status === 'AwaitingPayment' && (
            <RequirePermission permission={PERMISSIONS.facility.bookingApprove}>
              <Button
                disabled={isConfirming}
                onClick={() => runAction(() => confirmPayment({ id }).unwrap(), 'Payment confirmed.')}
              >
                Confirm Payment
              </Button>
            </RequirePermission>
          )}
          {status === 'Confirmed' && (
            <RequirePermission permission={PERMISSIONS.facility.bookingInspect}>
              <Button disabled={isCheckingIn} onClick={() => runAction(() => checkInBooking({ id }).unwrap(), 'Checked in.')}>
                Check In
              </Button>
            </RequirePermission>
          )}
          {status === 'Confirmed' && (
            <RequirePermission permission={PERMISSIONS.facility.bookingCancel}>
              <Button
                variant="outline"
                disabled={isMarkingNoShow}
                onClick={() => runAction(() => markNoShow({ id }).unwrap(), 'Marked no-show.')}
              >
                Mark No-Show
              </Button>
            </RequirePermission>
          )}
          {status === 'CheckedIn' && (
            <RequirePermission permission={PERMISSIONS.facility.bookingInspect}>
              <Button disabled={isCompleting} onClick={() => runAction(() => completeBooking({ id }).unwrap(), 'Booking completed.')}>
                Complete
              </Button>
            </RequirePermission>
          )}
          {status === 'Completed' && (
            <RequirePermission permission={PERMISSIONS.facility.bookingRefund}>
              <Button onClick={() => setDialog('inspect')}>Inspect</Button>
            </RequirePermission>
          )}
          {['Draft', 'PendingApproval', 'AwaitingPayment', 'Confirmed'].includes(status) && (
            <RequirePermission permission={PERMISSIONS.facility.bookingCancel}>
              <Button variant="outline" onClick={() => setDialog('cancel')}>
                Cancel
              </Button>
            </RequirePermission>
          )}
        </CardContent>
      </Card>

      <ApprovalTimeline booking={booking} />

      <OverrideReasonDialog
        open={dialog === 'reject'}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Reject booking"
        confirmLabel="Reject"
        confirmVariant="destructive"
        isSubmitting={isRejecting}
        onConfirm={(reason) =>
          runAction(
            () => rejectBooking({ id, rejectBookingRequest: { reason } }).unwrap(),
            'Booking rejected.',
          ).then(() => setDialog(null))
        }
      />

      <OverrideReasonDialog
        open={dialog === 'cancel'}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Cancel booking"
        description="If a deposit was collected, refund/forfeiture is computed automatically per the facility's cancellation policy."
        confirmLabel="Cancel Booking"
        confirmVariant="destructive"
        isSubmitting={isCancelling}
        onConfirm={(reason) =>
          runAction(
            () => cancelBooking({ id, cancelBookingRequest: { reason } }).unwrap(),
            'Booking cancelled.',
          ).then(() => setDialog(null))
        }
      />

      <InspectBookingDialog
        open={dialog === 'inspect'}
        onOpenChange={(open) => !open && setDialog(null)}
        isSubmitting={isInspecting}
        depositAmount={Number(booking.depositAmount)}
        onSubmit={(values) =>
          runAction(
            () =>
              inspectBooking({
                id,
                inspectBookingRequest: {
                  notes: values.notes || null,
                  damageDeductionAmount: values.damageDeductionAmount ?? null,
                  damageDeductionReason: values.damageDeductionReason || null,
                },
              }).unwrap(),
            'Booking inspected and closed.',
          ).then(() => setDialog(null))
        }
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
