import { InlineSpinner } from './InlineSpinner';

interface LoadingSpinnerProps {
  label?: string;
  fullscreen?: boolean;
}

/** A standalone loading block for a panel/page with nothing else to show yet. For a spinner next to
 * existing text or inside a button, use `InlineSpinner` directly instead. */
export function LoadingSpinner({ label = 'Loading…', fullscreen = false }: LoadingSpinnerProps) {
  const wrapper = fullscreen
    ? 'flex min-h-screen flex-col items-center justify-center gap-3'
    : 'flex flex-col items-center justify-center gap-3 p-8';

  return (
    <div className={wrapper} role="status" aria-live="polite">
      <InlineSpinner className="h-8 w-8 text-muted-foreground" />
      <span className="text-muted-foreground text-sm">{label}</span>
    </div>
  );
}
