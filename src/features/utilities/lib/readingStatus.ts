import type { StatusBadgeMap } from '@/components/ui/status-badge';
import { READING_STATUSES } from './constants';

export type ReadingStatus = (typeof READING_STATUSES)[number];

export const readingStatusToneMap: StatusBadgeMap<ReadingStatus> = {
  Draft: { label: 'Draft', variant: 'secondary' },
  Reviewed: { label: 'Reviewed', variant: 'info' },
  Finalized: { label: 'Finalized', variant: 'warning' },
  Billed: { label: 'Billed', variant: 'success' },
  Corrected: { label: 'Corrected', variant: 'secondary' },
};
