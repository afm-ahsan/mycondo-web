/** Duration between two ISO instants, formatted as "Xh Ym"; open-ended (no clock-out yet) shows "—". Mirrors amenities/lib/format.ts's formatDuration. */
export function formatWorkedDuration(checkInIso: string, checkOutIso: string | null | undefined): string {
  if (!checkOutIso) return '—';
  const minutes = Math.max(0, Math.round((new Date(checkOutIso).getTime() - new Date(checkInIso).getTime()) / 60000));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours > 0 ? `${hours}h ${remainder}m` : `${remainder}m`;
}

/** Formats a server-computed overtime-minutes count as "Xh Ym"; 0 shows "—". */
export function formatOvertimeMinutes(overtimeMinutes: number | string): string {
  const minutes = Math.round(Number(overtimeMinutes));
  if (!Number.isFinite(minutes) || minutes <= 0) return '—';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours > 0 ? `${hours}h ${remainder}m` : `${remainder}m`;
}

export function formatTimeOfDay(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** Renders a scheduled shift window as "9:00 AM – 5:00 PM"; "—" if neither bound is set. */
export function formatShift(scheduledStartUtc: string | null | undefined, scheduledEndUtc: string | null | undefined): string {
  if (!scheduledStartUtc && !scheduledEndUtc) return '—';
  return `${formatTimeOfDay(scheduledStartUtc)} – ${formatTimeOfDay(scheduledEndUtc)}`;
}
