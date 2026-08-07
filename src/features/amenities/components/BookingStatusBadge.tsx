import { StatusBadge } from '@/components/ui/status-badge';
import { bookingStatusToneMap, type BookingStatus } from '../lib/bookingStatus';

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <StatusBadge status={status} toneMap={bookingStatusToneMap} />;
}
