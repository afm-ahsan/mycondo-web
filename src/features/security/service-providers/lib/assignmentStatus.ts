import type { ServiceProviderAssignmentDto } from '@/api/generated/mycondoApi';

// See domestic-workers/lib/assignmentStatus.ts for the full rationale — identical shared status
// model, identical client-side-only derivation for display purposes.
export function isAssignmentExpired(assignment: Pick<ServiceProviderAssignmentDto, 'validToUtc'>): boolean {
  return assignment.validToUtc !== null && new Date(assignment.validToUtc) < new Date();
}
