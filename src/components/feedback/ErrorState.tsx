import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  description: string;
  /** Re-runs the failed request (e.g. a query's `refetch`). Omit if the failure isn't retryable. */
  onRetry?: () => void;
}

/**
 * A load failure with a way to recover, distinct from `EmptyState` (which means the request
 * succeeded but returned nothing) — keeping these two states visually and semantically separate is
 * part of the UX-1 error/empty/feedback convention.
 */
export function ErrorState({ title = 'Something went wrong', description, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
      <AlertCircle className="text-destructive size-8" aria-hidden="true" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          <RefreshCw /> Try again
        </Button>
      )}
    </div>
  );
}
