import { formatBdt } from '@/lib/helpers';
import { cn } from '@/lib/utils';

interface MoneyDisplayProps {
  amount: number | string | null | undefined;
  className?: string;
  /** Highlights a negative amount (e.g. resident credit/overpayment) distinctly, not just via a
   * minus sign — per the "unambiguous negative/positive values" financial UX standard. */
  emphasizeNegative?: boolean;
}

/**
 * Consistent right-alignable, tabular-numeral rendering of a server-supplied money value —
 * formatting only, never a calculation. Wraps the shared `formatBdt` (src/lib/helpers.ts) so every
 * financial table cell gets the same BDT formatting and digit alignment without repeating className
 * boilerplate at every call site.
 */
export function MoneyDisplay({ amount, className, emphasizeNegative = false }: MoneyDisplayProps) {
  const numeric = amount === null || amount === undefined ? null : Number(amount);
  const isNegative = emphasizeNegative && numeric !== null && Number.isFinite(numeric) && numeric < 0;

  return <span className={cn('tabular-nums', isNegative && 'text-destructive', className)}>{formatBdt(amount)}</span>;
}
