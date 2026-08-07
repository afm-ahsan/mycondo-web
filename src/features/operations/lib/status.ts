import type { StatusBadgeMap } from '@/components/ui/status-badge';

// Mirrors GeneratorSessionStatus.cs (mycondo-api Features/Operations/GeneratorSessions).
export type GeneratorSessionStatus = 'Open' | 'Closed';

export const generatorSessionStatusToneMap: StatusBadgeMap<GeneratorSessionStatus> = {
  Open: { label: 'Open', variant: 'primary' },
  Closed: { label: 'Closed', variant: 'secondary' },
};

// Mirrors CylinderPurchaseApprovalStatus.cs.
export type CylinderPurchaseApprovalStatus = 'PendingApproval' | 'Approved' | 'Rejected';

export const cylinderPurchaseApprovalStatusToneMap: StatusBadgeMap<CylinderPurchaseApprovalStatus> = {
  PendingApproval: { label: 'Pending Approval', variant: 'warning' },
  Approved: { label: 'Approved', variant: 'success' },
  Rejected: { label: 'Rejected', variant: 'destructive' },
};

// Mirrors CylinderPurchasePaymentStatus.cs.
export type CylinderPurchasePaymentStatus = 'Unpaid' | 'Paid';

export const cylinderPurchasePaymentStatusToneMap: StatusBadgeMap<CylinderPurchasePaymentStatus> = {
  Unpaid: { label: 'Unpaid', variant: 'warning' },
  Paid: { label: 'Paid', variant: 'success' },
};

// Mirrors CylinderStockMovementType.cs.
export type CylinderStockMovementType = 'Receipt' | 'Issue' | 'EmptyReturn' | 'Adjustment';

export const cylinderStockMovementTypeToneMap: StatusBadgeMap<CylinderStockMovementType> = {
  Receipt: { label: 'Receipt', variant: 'success' },
  Issue: { label: 'Issue', variant: 'info' },
  EmptyReturn: { label: 'Empty Return', variant: 'secondary' },
  Adjustment: { label: 'Adjustment', variant: 'warning' },
};
