import type { StatusBadgeMap } from '@/components/ui/status-badge';
import type { BookingDto } from '@/api/generated/mycondoApi';

// Mirrors Booking.BookingStatus exactly (mycondo-api Features/Amenities/Bookings/BookingStatus.cs) —
// ten values, no client-invented states.
export type BookingStatus =
  | 'Draft'
  | 'PendingApproval'
  | 'AwaitingPayment'
  | 'Confirmed'
  | 'CheckedIn'
  | 'Completed'
  | 'Cancelled'
  | 'Rejected'
  | 'NoShow'
  | 'ClosedAfterInspection';

export const bookingStatusToneMap: StatusBadgeMap<BookingStatus> = {
  Draft: { label: 'Draft', variant: 'secondary' },
  PendingApproval: { label: 'Pending Approval', variant: 'warning' },
  AwaitingPayment: { label: 'Awaiting Payment', variant: 'warning' },
  Confirmed: { label: 'Confirmed', variant: 'info' },
  CheckedIn: { label: 'Checked In', variant: 'primary' },
  Completed: { label: 'Completed', variant: 'success' },
  Cancelled: { label: 'Cancelled', variant: 'destructive' },
  Rejected: { label: 'Rejected', variant: 'destructive' },
  NoShow: { label: 'No-Show', variant: 'destructive' },
  ClosedAfterInspection: { label: 'Closed', variant: 'success' },
};

// Derived, presentation-only — mirrors mycondo-web plan §5 "Payment status (derived, not a backend
// field)". Not a client-owned business-state transition: every input here is already an
// authoritative field returned by the backend, this only labels their combination.
export type PaymentStatus = 'NotRequired' | 'AwaitingPayment' | 'Paid';

export const paymentStatusToneMap: StatusBadgeMap<PaymentStatus> = {
  NotRequired: { label: 'Not Required', variant: 'secondary' },
  AwaitingPayment: { label: 'Awaiting Payment', variant: 'warning' },
  Paid: { label: 'Paid', variant: 'success' },
};

export function derivePaymentStatus(booking: BookingDto): PaymentStatus {
  if (!booking.paymentRequired) return 'NotRequired';
  if (booking.invoiceId || booking.depositCollectionPostingId) return 'Paid';
  return 'AwaitingPayment';
}

// Mirrors PoolSessions.PoolSessionStatus.cs — two values.
export type PoolSessionStatus = 'CheckedIn' | 'CheckedOut';

export const poolSessionStatusToneMap: StatusBadgeMap<PoolSessionStatus> = {
  CheckedIn: { label: 'Checked In', variant: 'primary' },
  CheckedOut: { label: 'Checked Out', variant: 'secondary' },
};

/** Splits the backend's single joined denial sentence ("Cannot check in: X; Y. An override reason is
 * required to proceed.") into a bulleted list of individual reasons — see mycondo-web plan §6
 * "Denial-reason display" for why this parsing lives client-side rather than requiring a backend
 * change. Falls back to the raw message as a single item if it doesn't match the expected shape. */
export function parseDenialReasons(message: string): string[] {
  const match = /^Cannot check in: (.+?)\.\s*(?:An override reason is required to proceed\.)?$/.exec(
    message.trim(),
  );
  const body = match ? match[1] : message.trim();
  return body
    .split(';')
    .map((reason) => reason.trim())
    .filter(Boolean);
}
