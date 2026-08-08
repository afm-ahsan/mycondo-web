// Mirrors mycondo-api's ServiceChargeRule.CalculationMethod, BillingFrequency, and Flats.FlatType
// enums exactly (Domain/Features/Billing/ServiceChargeRules).
export const CALCULATION_METHODS = ['FixedAmount', 'PerSquareFoot'] as const;
export const BILLING_FREQUENCIES = ['Monthly', 'Quarterly', 'Annually'] as const;
export const FLAT_TYPES = ['Residential', 'Commercial', 'Other'] as const;

// Mirrors mycondo-api's InvoiceSource enum — Invoice is a shared aggregate across Service Charges,
// Utilities, and Facility Booking, discriminated by this field. One Invoice List/Details screen
// serves all three sources.
export const INVOICE_SOURCES = ['ServiceCharge', 'Utility', 'FacilityBooking'] as const;
