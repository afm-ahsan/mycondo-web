import type { StatusBadgeMap } from '@/components/ui/status-badge';
import { METER_STATUSES } from './constants';

export type MeterStatus = (typeof METER_STATUSES)[number];

export const meterStatusToneMap: StatusBadgeMap<MeterStatus> = {
  Active: { label: 'Active', variant: 'success' },
  Faulty: { label: 'Faulty', variant: 'destructive' },
  Inactive: { label: 'Inactive', variant: 'secondary' },
  Replaced: { label: 'Replaced', variant: 'secondary' },
};
