import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface PageSkeletonProps {
  /** How many content blocks to render inside the card while the page's real shape loads. */
  blocks?: number;
}

/**
 * A generic full-page placeholder for a screen whose content shape isn't known yet on first paint
 * (e.g. a details/review page before the record loads). Prefer `TableSkeleton` instead when the page
 * is a list — this is for everything else.
 */
export function PageSkeleton({ blocks = 3 }: PageSkeletonProps) {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-7 w-72" />
      </div>
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          {Array.from({ length: blocks }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
