// Mirrors mycondo-api's ProviderType/RecurringAccessProfileStatus enums (Features/Security/ServiceProviders)
// — the generated client types these fields as plain `string`, so the valid values are hand-kept here.
export const PROVIDER_TYPES = ['Teacher', 'Tutor', 'Nurse', 'Therapist', 'Trainer', 'Other'] as const;

// Active/Suspended/Blocked only — same shared status model as Domestic Staff (RecurringAccessProfileStatus).
export const PROVIDER_STATUSES = ['Active', 'Suspended', 'Blocked'] as const;
