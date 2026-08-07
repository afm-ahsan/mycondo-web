import { LoaderCircleIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineSpinnerProps {
  className?: string;
}

/**
 * The bare spinning icon, sized for inline use next to text or inside a button
 * (`<Button disabled={isLoading}><InlineSpinner /> Saving…</Button>`). For a
 * standalone loading block (a whole panel/page with nothing else to show yet),
 * use `LoadingSpinner` instead — it wraps this with the accessible status role.
 */
export function InlineSpinner({ className }: InlineSpinnerProps) {
  return <LoaderCircleIcon className={cn('h-4 w-4 animate-spin', className)} aria-hidden="true" />;
}
