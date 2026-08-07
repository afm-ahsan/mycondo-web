// Mirrors mycondo-api's WorkerType/RecurringAccessProfileStatus enums (Features/Security/DomesticWorkers)
// — the generated client types these fields as plain `string`, so the valid values are hand-kept here.
export const WORKER_TYPES = ['Maid', 'Cook', 'Driver', 'Cleaner', 'Gardener', 'Other'] as const;

// Active/Suspended/Blocked only — there is no persisted "Expired" status. Assignment expiry is a
// separate, per-assignment concept (see lib/assignmentStatus.ts), not a profile-level status value.
export const WORKER_STATUSES = ['Active', 'Suspended', 'Blocked'] as const;
