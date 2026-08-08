// Mirrors mycondo-api's Utilities domain enums exactly (Domain/Features/Utilities) — one shared
// model for Electricity and Gas, discriminated by UtilityType. No separate enums per utility.
export const UTILITY_TYPES = ['Electricity', 'Gas'] as const;
export type UtilityType = (typeof UTILITY_TYPES)[number];

export const METER_STATUSES = ['Active', 'Faulty', 'Inactive', 'Replaced'] as const;
export const RATE_STRUCTURES = ['Metered', 'Fixed'] as const;
export const READING_STATUSES = ['Draft', 'Reviewed', 'Finalized', 'Billed', 'Corrected'] as const;
