import { useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { AlertTriangle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { formatDateTime } from '@/lib/helpers';
import { toApiError } from '@/lib/forms/applyApiErrorToForm';
import {
  useCancelBookingIdempotentMutation,
  useConfirmBookingPaymentIdempotentMutation,
  useInspectBookingIdempotentMutation,
  useMarkBookingNoShowIdempotentMutation,
} from '@/api/idempotentEndpoints';
import { useIdempotencyKey } from '@/lib/idempotency/useIdempotencyKey';
import {
  useApproveBooking,
  useBooking,
  useCheckInBooking,
  useCompleteBooking,
  useRejectBooking,
  useSubmitBooking,
} from '../../api/bookingsApi';
import { useFacility } from '../../api/facilitiesApi';
import { ApprovalTimeline } from '../../components/ApprovalTimeline';
import { BookingStatusBadge } from '../../components/BookingStatusBadge';
import { DepositSummaryPanel } from '../../components/DepositSummaryPanel';
import { InspectBookingDialog } from '../../components/InspectBookingDialog';
import { InspectionPanel } from '../../components/InspectionPanel';
import { ReasonDialog } from '@/components/shared/ReasonDialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { PaymentStatusBadge } from '../../components/PaymentStatusBadge';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import type { BookingStatus } from '../../lib/bookingStatus';

type DialogKind = 'reject' | 'cancel' | 'inspect' | 'approve' | 'confirmPayment' | 'checkIn' | 'complete' | 'markNoShow' | null;

/**
 * Every action button is rendered only for the BookingStatus values Booking.cs actually allows for
 * that transition (mirrors the backend's own transition table — see Slice G plan §5) — an invalid
 * action is never offered, not just disabled.
 */
export function BookingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: booking, isLoading, isError, error, refetch } = useBooking(id ? { id } : skipToken);
  const { data: facility } = useFacility(booking ? { id: booking.facilityId } : skipToken);

  const [submitBooking, { isLoading: isSubmitting }] = useSubmitBooking();
  const [approveBooking, { isLoading: isApproving }] = useApproveBooking();
  const [rejectBooking, { isLoading: isRejecting }] = useRejectBooking();
  const [confirmPayment, { isLoading: isConfirming }] = useConfirmBookingPaymentIdempotentMutation();
  const [checkInBooking, { isLoading: isCheckingIn }] = useCheckInBooking();
  const [completeBooking, { isLoading: isCompleting }] = useCompleteBooking();
  const [inspectBooking, { isLoading: isInspecting }] = useInspectBookingIdempotentMutation();
  const [cancelBooking, { isLoading: isCancelling }] = useCancelBookingIdempotentMutation();
  const [markNoShow, { isLoading: isMarkingNoShow }] = useMarkBookingNoShowIdempotentMutation();

  const [confirmPaymentKey, resetConfirmPaymentKey] = useIdempotencyKey();
  const [markNoShowKey, resetMarkNoShowKey] = useIdempotencyKey();
  const [cancelKey, resetCancelKey] = useIdempotencyKey();
  const [inspectKey, resetInspectKey] = useIdempotencyKey();

  const [dialog, setDialog] = useState<DialogKind>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!id) return null;
  if (isLoading) return <PageSkeleton />;
  if (isError || !booking) {
    return (
      <Card>
        <ErrorState description={toUserMessage(toApiError(error) ?? error)} onRetry={refetch} />
      </Card>
    );
  }

  const status = booking.status as BookingStatus;

  async function runAction(action: () => Promise<unknown>, successMessage: string, onSuccess?: () => void) {
    setActionError(null);
    try {
      await action();
      toast.success(successMessage);
      onSuccess?.();
      return true;
    } catch (err) {
      setActionError(toUserMessage(toApiError(err) ?? err));
      return false;
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
            <Field label="Booking charge" value={<MoneyDisplay amount={booking.bookingChargeAmount} />} />
            <Field label="Deposit" value={<MoneyDisplay amount={booking.depositAmount} />} />
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
              <Button onClick={() => setDialog('approve')}>Approve</Button>
              <Button variant="destructive" onClick={() => setDialog('reject')}>
                Reject
              </Button>
            </RequirePermission>
          )}
          {status === 'AwaitingPayment' && (
            <RequirePermission permission={PERMISSIONS.facility.bookingApprove}>
              <Button onClick={() => setDialog('confirmPayment')}>Confirm Payment</Button>
            </RequirePermission>
          )}
          {status === 'Confirmed' && (
            <RequirePermission permission={PERMISSIONS.facility.bookingInspect}>
              <Button onClick={() => setDialog('checkIn')}>Check In</Button>
            </RequirePermission>
          )}
          {status === 'Confirmed' && (
            <RequirePermission permission={PERMISSIONS.facility.bookingCancel}>
              <Button variant="outline" onClick={() => setDialog('markNoShow')}>
                Mark No-Show
              </Button>
            </RequirePermission>
          )}
          {status === 'CheckedIn' && (
            <RequirePermission permission={PERMISSIONS.facility.bookingInspect}>
              <Button onClick={() => setDialog('complete')}>Complete</Button>
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

      <ConfirmActionDialog
        open={dialog === 'approve'}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Approve this booking?"
        description="The resident will be able to proceed to payment (if required) or confirmation."
        confirmLabel="Approve"
        loadingLabel="Approving..."
        isLoading={isApproving}
        onConfirm={() =>
          runAction(() => approveBooking({ id }).unwrap(), 'Booking approved.', () => setDialog(null))
        }
      />

      <ConfirmActionDialog
        open={dialog === 'confirmPayment'}
        onOpenChange={(open) => {
          if (!open) resetConfirmPaymentKey();
          setDialog(null);
        }}
        title="Confirm payment for this booking?"
        description={
          <>
            This bills the booking charge (<MoneyDisplay amount={booking.bookingChargeAmount} />) as an invoice and posts the deposit (
            <MoneyDisplay amount={booking.depositAmount} />) as held, then confirms the booking.
          </>
        }
        confirmLabel="Confirm Payment"
        loadingLabel="Confirming..."
        isLoading={isConfirming}
        onConfirm={() =>
          runAction(
            () => confirmPayment({ id, idempotencyKey: confirmPaymentKey }).unwrap(),
            'Payment confirmed.',
            () => setDialog(null),
          )
        }
      />

      <ConfirmActionDialog
        open={dialog === 'checkIn'}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Check in this booking?"
        description="Marks the event as started. This cannot be undone directly — only through Cancel/Inspect."
        confirmLabel="Check In"
        loadingLabel="Checking in..."
        isLoading={isCheckingIn}
        onConfirm={() => runAction(() => checkInBooking({ id }).unwrap(), 'Checked in.', () => setDialog(null))}
      />

      <ConfirmActionDialog
        open={dialog === 'complete'}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Mark this booking complete?"
        description="Marks the event as finished and makes it available for inspection/deposit settlement."
        confirmLabel="Complete"
        loadingLabel="Completing..."
        isLoading={isCompleting}
        onConfirm={() => runAction(() => completeBooking({ id }).unwrap(), 'Booking completed.', () => setDialog(null))}
      />

      <ConfirmActionDialog
        open={dialog === 'markNoShow'}
        onOpenChange={(open) => {
          if (!open) resetMarkNoShowKey();
          setDialog(null);
        }}
        title="Mark this booking as no-show?"
        description="If a deposit was collected, it is forfeited per the facility's cancellation policy (as if cancelled within the deadline). This cannot be undone."
        confirmLabel="Mark No-Show"
        loadingLabel="Saving..."
        isLoading={isMarkingNoShow}
        onConfirm={() =>
          runAction(
            () => markNoShow({ id, idempotencyKey: markNoShowKey }).unwrap(),
            'Marked no-show.',
            () => setDialog(null),
          )
        }
      />

      <ReasonDialog
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
          ).then((success) => success && setDialog(null))
        }
      />

      <ReasonDialog
        open={dialog === 'cancel'}
        onOpenChange={(open) => {
          if (!open) resetCancelKey();
          setDialog(null);
        }}
        title="Cancel booking"
        description="If a deposit was collected, refund/forfeiture is computed automatically per the facility's cancellation policy."
        confirmLabel="Cancel Booking"
        confirmVariant="destructive"
        isSubmitting={isCancelling}
        onConfirm={(reason) =>
          runAction(
            () => cancelBooking({ id, cancelBookingRequest: { reason }, idempotencyKey: cancelKey }).unwrap(),
            'Booking cancelled.',
            () => {
              resetCancelKey();
              setDialog(null);
            },
          )
        }
      />

      <InspectBookingDialog
        open={dialog === 'inspect'}
        onOpenChange={(open) => {
          if (!open) resetInspectKey();
          setDialog(null);
        }}
        isSubmitting={isInspecting}
        depositAmount={Number(booking.depositAmount)}
        onSubmit={(values) =>
          runAction(
            () =>
              inspectBooking({
                id,
                idempotencyKey: inspectKey,
                inspectBookingRequest: {
                  notes: values.notes || null,
                  damageDeductionAmount: values.damageDeductionAmount ?? null,
                  damageDeductionReason: values.damageDeductionReason || null,
                },
              }).unwrap(),
            'Booking inspected and closed.',
            () => {
              resetInspectKey();
              setDialog(null);
            },
          )
        }
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
