import { Badge, type BadgeProps } from '@/components/ui/badge';

export interface StatusBadgeTone {
  label: string;
  variant: NonNullable<BadgeProps['variant']>;
}

export type StatusBadgeMap<TStatus extends string> = Record<TStatus, StatusBadgeTone>;

interface StatusBadgeProps<TStatus extends string> {
  status: TStatus;
  toneMap: StatusBadgeMap<TStatus>;
}

/**
 * Renders a status value as a `Badge` using a per-feature status→(label, variant) map, so each
 * register defines its own status vocabulary (e.g. guest check-in status vs. invoice status)
 * without a shared enum, while reusing the same rendering + `appearance="light"` styling.
 */
export function StatusBadge<TStatus extends string>({ status, toneMap }: StatusBadgeProps<TStatus>) {
  const tone = toneMap[status];

  return (
    <Badge variant={tone?.variant ?? 'secondary'} appearance="light">
      {tone?.label ?? status}
    </Badge>
  );
}
