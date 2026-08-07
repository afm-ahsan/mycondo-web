import { StatusBadge } from '@/components/ui/status-badge';
import { derivePaymentStatus, paymentStatusToneMap } from '../lib/bookingStatus';
import type { BookingDto } from '@/api/generated/mycondoApi';

export function PaymentStatusBadge({ booking }: { booking: BookingDto }) {
  return <StatusBadge status={derivePaymentStatus(booking)} toneMap={paymentStatusToneMap} />;
}
