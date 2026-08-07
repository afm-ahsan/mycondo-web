import type { StatusBadgeMap } from '@/components/ui/status-badge';

// Mirrors OccupancyRegistrationStatus.cs (mycondo-api Features/Leasing/OccupancyRegistrations).
export type TenantRegistrationStatus =
  | 'Draft'
  | 'Submitted'
  | 'OwnerApproved'
  | 'CorrectionsRequested'
  | 'ManagementVerified'
  | 'Rejected'
  | 'Active'
  | 'MovedOut';

export const tenantRegistrationStatusToneMap: StatusBadgeMap<TenantRegistrationStatus> = {
  Draft: { label: 'Draft', variant: 'secondary' },
  Submitted: { label: 'Submitted', variant: 'info' },
  OwnerApproved: { label: 'Owner Approved', variant: 'info' },
  CorrectionsRequested: { label: 'Corrections Requested', variant: 'warning' },
  ManagementVerified: { label: 'Management Verified', variant: 'primary' },
  Rejected: { label: 'Rejected', variant: 'destructive' },
  Active: { label: 'Active', variant: 'success' },
  MovedOut: { label: 'Moved Out', variant: 'secondary' },
};
