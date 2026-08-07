import { Progress } from '@/components/ui/progress';

interface CapacityIndicatorProps {
  current: number;
  capacity: number;
}

/** Occupancy bar — used + remaining out of a facility's capacity (pool current occupancy). */
export function CapacityIndicator({ current, capacity }: CapacityIndicatorProps) {
  const percentage = capacity > 0 ? Math.min(100, Math.round((current / capacity) * 100)) : 0;
  const atCapacity = current >= capacity;
  const remaining = Math.max(0, capacity - current);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>
          {current} of {capacity} occupied
        </span>
        <span className={atCapacity ? 'text-destructive font-medium' : 'text-muted-foreground'}>
          {atCapacity ? 'At capacity' : `${remaining} remaining`}
        </span>
      </div>
      <Progress value={percentage} indicatorClassName={atCapacity ? 'bg-destructive' : undefined} />
    </div>
  );
}
