// formatBdt moved to src/lib/helpers.ts (UX-3) — import it from there now.

export function formatTimeOfDay(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** Duration between two ISO instants, formatted as "Xh Ym"; open-ended (no exit yet) shows "—". */
export function formatDuration(entryIso: string, exitIso: string | null | undefined): string {
  if (!exitIso) return '—';
  const minutes = Math.max(0, Math.round((new Date(exitIso).getTime() - new Date(entryIso).getTime()) / 60000));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours > 0 ? `${hours}h ${remainder}m` : `${remainder}m`;
}
