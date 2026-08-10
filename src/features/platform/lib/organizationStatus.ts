import type { StatusBadgeMap } from '@/components/ui/status-badge';

// Mirrors TenantStatus.cs (mycondo-api Domain/Features/Tenancy) exactly — no 4th "Disabled" state
// exists; Suspended is the non-destructive disable state.
export type OrganizationStatus = 'PendingActivation' | 'Active' | 'Suspended';

export const organizationStatusToneMap: StatusBadgeMap<OrganizationStatus> = {
  PendingActivation: { label: 'Provisioning', variant: 'warning' },
  Active: { label: 'Active', variant: 'success' },
  Suspended: { label: 'Suspended', variant: 'destructive' },
};
