import type { StatusBadgeMap } from '@/components/ui/status-badge';

// Mirrors mycondo-api's PaymentStatus enum exactly (Domain/Features/Payments/Payments).
export const PAYMENT_STATUSES = ['Posted', 'Reversed'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const paymentStatusToneMap: StatusBadgeMap<PaymentStatus> = {
  Posted: { label: 'Posted', variant: 'success' },
  Reversed: { label: 'Reversed', variant: 'destructive' },
};
