import type { StatusBadgeMap } from '@/components/ui/status-badge';

// Mirrors mycondo-api's InvoiceStatus enum exactly (Domain/Features/Billing/Invoices) — do not invent
// additional statuses. A PartiallyPaid invoice can never reach Void (Invoice.Void requires
// AmountPaid == 0), so Void is only ever reachable from Issued.
export const INVOICE_STATUSES = ['Issued', 'PartiallyPaid', 'Paid', 'Void'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const invoiceStatusToneMap: StatusBadgeMap<InvoiceStatus> = {
  Issued: { label: 'Issued', variant: 'info' },
  PartiallyPaid: { label: 'Partially Paid', variant: 'warning' },
  Paid: { label: 'Paid', variant: 'success' },
  Void: { label: 'Void', variant: 'secondary' },
};
