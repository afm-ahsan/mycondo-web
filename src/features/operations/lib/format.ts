// Feature-local BDT formatter, matching amenities/lib/format.ts's precedent — no shared money
// formatter exists yet elsewhere in the app to centralize this into.
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

export function formatNumber(value: number | string | null | undefined, fractionDigits = 2): string {
  if (value === null || value === undefined) return '—';
  const numeric = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(numeric) ? numeric.toFixed(fractionDigits) : '—';
}
