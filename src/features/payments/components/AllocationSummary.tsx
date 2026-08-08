import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import type { PaymentAllocationDto } from '@/api/generated/mycondoApi';

interface AllocationSummaryProps {
  allocations: PaymentAllocationDto[];
}

/**
 * Read-only render of a payment's server-returned FIFO allocation breakdown — displays exactly what
 * the API returned (invoice number + allocated amount per invoice); never computes or re-derives an
 * allocated amount client-side.
 */
export function AllocationSummary({ allocations }: AllocationSummaryProps) {
  if (allocations.length === 0) {
    return <p className="text-muted-foreground text-sm">No invoices were allocated against this payment.</p>;
  }

  return (
    <ul className="space-y-1.5">
      {allocations.map((allocation) => (
        <li
          key={allocation.paymentAllocationId}
          className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-2 text-sm"
        >
          <span className="font-mono text-xs text-muted-foreground">{allocation.invoiceNumber}</span>
          <MoneyDisplay amount={allocation.allocatedAmount} className="font-medium" />
        </li>
      ))}
    </ul>
  );
}
