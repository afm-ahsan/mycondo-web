// No shared BDT/money formatter exists yet elsewhere in the app (mycondo-web has had no
// billing/payments frontend work) — kept feature-local rather than promoted to `src/lib/`
// speculatively; a natural candidate to centralize once Billing/Payments get frontend slices.
const bdtFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'BDT',
  currencyDisplay: 'symbol',
});

export function formatBdt(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  const numeric = typeof amount === 'string' ? Number(amount) : amount;
  return Number.isFinite(numeric) ? bdtFormatter.format(numeric) : '—';
}

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
