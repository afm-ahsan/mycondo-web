import { MoneyDisplay } from '@/components/shared/MoneyDisplay';

/**
 * A monetary rate (BDT per kilogram), not a plain quantity — renders the currency amount via the
 * shared `MoneyDisplay` plus an explicit "/kg" unit, so it's never mistaken for a bare number the
 * way `formatNumber()` would render it (see UX-4 discovery: this same value was formatted two
 * different ways across CylinderPurchaseListPage and SupplierComparisonPage).
 */
export function RatePerKg({ amount }: { amount: number | string }) {
  return (
    <span className="inline-flex items-baseline gap-0.5">
      <MoneyDisplay amount={amount} />
      <span className="text-muted-foreground text-xs">/kg</span>
    </span>
  );
}
