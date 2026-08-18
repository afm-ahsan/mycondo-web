import { parseDateOnly } from '@/lib/helpers';

/**
 * Formats an already-known [periodStart, periodEnd] pair for display — pure presentation, never
 * derives what a billing period *should* be. A whole-calendar-month range collapses to "August
 * 2026"; anything else (a custom Utility/FacilityBooking range) shows both bounds.
 */
export function formatBillingPeriod(periodStart: string, periodEnd: string): string {
  const start = parseDateOnly(periodStart);
  const end = parseDateOnly(periodEnd);

  const isFullCalendarMonth =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === 1 &&
    end.getDate() === new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();

  if (isFullCalendarMonth) {
    return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endLabel = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startLabel} – ${endLabel}`;
}
