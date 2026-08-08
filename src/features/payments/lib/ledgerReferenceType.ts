// The real, finite set of ReferenceType values LedgerPosting.Create's callers actually use
// (mycondo-api — grepped every call site: GenerateInvoiceBatch, RecordPayment, ReversePayment,
// VoidInvoice/CorrectReading, RecordOpeningBalance, BillReading). Not an invented frontend
// taxonomy — do not add values here that the backend doesn't produce.
export const LEDGER_REFERENCE_TYPES = [
  'Invoice',
  'Payment',
  'PaymentReversal',
  'OpeningBalance',
  'InvoiceVoid',
  'UtilityBill',
] as const;

const LEDGER_REFERENCE_TYPE_LABELS: Record<(typeof LEDGER_REFERENCE_TYPES)[number], string> = {
  Invoice: 'Invoice issued',
  Payment: 'Payment received',
  PaymentReversal: 'Payment reversed',
  OpeningBalance: 'Opening balance',
  InvoiceVoid: 'Invoice voided',
  UtilityBill: 'Utility bill issued',
};

export function ledgerReferenceTypeLabel(referenceType: string | null | undefined): string {
  if (!referenceType) return 'Other';
  return LEDGER_REFERENCE_TYPE_LABELS[referenceType as (typeof LEDGER_REFERENCE_TYPES)[number]] ?? referenceType;
}
