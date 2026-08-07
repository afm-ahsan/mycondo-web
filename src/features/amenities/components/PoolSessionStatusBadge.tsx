import { StatusBadge } from '@/components/ui/status-badge';
import { poolSessionStatusToneMap, type PoolSessionStatus } from '../lib/bookingStatus';

export function PoolSessionStatusBadge({ status }: { status: PoolSessionStatus }) {
  return <StatusBadge status={status} toneMap={poolSessionStatusToneMap} />;
}
