import type { DomesticWorkerAssignmentDto } from '@/api/generated/mycondoApi';

/**
 * There is no persisted "Expired" value anywhere in the API — validity is computed server-side at
 * check-in time from validFromUtc/validToUtc/allowedDays/allowedStartTime/allowedEndTime. This is the
 * client-side-only equivalent for *display* purposes (a badge on the assignment list), matching the
 * UX-2 discovery report's finding on DomesticWorkerAssignmentDto. It must never be used to allow or
 * block a check-in — the backend does that independently and is the only source of truth for it.
 */
export function isAssignmentExpired(assignment: Pick<DomesticWorkerAssignmentDto, 'validToUtc'>): boolean {
  return assignment.validToUtc !== null && new Date(assignment.validToUtc) < new Date();
}
