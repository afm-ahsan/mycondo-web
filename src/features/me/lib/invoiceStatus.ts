import type { StatusBadgeMap } from '@/components/ui/status-badge';

// Duplicated (not imported) from src/features/billing/lib/invoiceStatus.ts — billing does not
// export it via its public surface (index.ts), and this feature only needs the display tone map,
// not any billing behavior. Mirrors mycondo-api's InvoiceStatus enum exactly.
export const INVOICE_STATUSES = ['Issued', 'PartiallyPaid', 'Paid', 'Void'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const invoiceStatusToneMap: StatusBadgeMap<InvoiceStatus> = {
  Issued: { label: 'Issued', variant: 'info' },
  PartiallyPaid: { label: 'Partially Paid', variant: 'warning' },
  Paid: { label: 'Paid', variant: 'success' },
  Void: { label: 'Void', variant: 'secondary' },
};
