import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { InlineSpinner } from '@/components/feedback/InlineSpinner';
import { cn } from '@/lib/utils';

type KpiTone = 'primary' | 'success' | 'warning' | 'info' | 'destructive';

interface KpiCardProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  isLoading?: boolean;
  caption?: string;
  tone?: KpiTone;
  className?: string;
}

const TONE_ICON_CLASSES: Record<KpiTone, string> = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  info: 'text-info',
  destructive: 'text-destructive',
};

/**
 * Deliberately dumb — renders whatever value/caption it's given and nothing else. No data-fetching,
 * permission checking, or calculation happens here; callers (dashboard/report widgets) own the RTK
 * Query hook, loading/error handling, and permission gating, and pass in an already-authoritative
 * value.
 */
export function KpiCard({ label, value, icon: Icon, isLoading = false, caption, tone = 'primary', className }: KpiCardProps) {
  return (
    <Card className={className}>
      <CardContent className="flex items-start gap-3 py-5">
        {Icon && <Icon className={cn('size-5 shrink-0 mt-0.5', TONE_ICON_CLASSES[tone])} aria-hidden="true" />}
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="text-2xl font-semibold tabular-nums mt-0.5">
            {isLoading ? <InlineSpinner /> : value}
          </p>
          {caption && <p className="text-muted-foreground text-xs mt-1">{caption}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
