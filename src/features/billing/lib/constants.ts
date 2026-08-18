// Mirrors mycondo-api's ServiceChargeRule.CalculationMethod, BillingFrequency, and Flats.FlatType
// enums exactly (Domain/Features/Billing/ServiceChargeRules).
export const CALCULATION_METHODS = ['FixedAmount', 'PerSquareFoot'] as const;
export const BILLING_FREQUENCIES = ['Monthly', 'Quarterly', 'Annually'] as const;
export const FLAT_TYPES = ['Residential', 'Commercial', 'Other'] as const;

// Single source of truth for the calculation-method business label — used by the create form and
// every read view (rule directory, rule manage dialog, invoice line snapshot) so the wording can't
// drift between them.
export const CALCULATION_METHOD_LABELS: Record<(typeof CALCULATION_METHODS)[number], string> = {
  FixedAmount: 'Fixed Amount',
  PerSquareFoot: 'Per Square Foot',
};

// Mirrors mycondo-api's InvoiceSource enum — Invoice is a shared aggregate across Service Charges,
// Utilities, and Facility Booking, discriminated by this field. One Invoice List/Details screen
// serves all three sources.
export const INVOICE_SOURCES = ['ServiceCharge', 'Utility', 'FacilityBooking'] as const;
