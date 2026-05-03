interface LoadingSpinnerProps {
  label?: string;
  fullscreen?: boolean;
}

export function LoadingSpinner({ label = 'Loading…', fullscreen = false }: LoadingSpinnerProps) {
  const wrapper = fullscreen
    ? 'flex min-h-screen flex-col items-center justify-center gap-3'
    : 'flex flex-col items-center justify-center gap-3 p-8';

  return (
    <div className={wrapper} role="status" aria-live="polite">
      <div className="border-primary border-t-transparent h-8 w-8 animate-spin rounded-full border-2" />
      <span className="text-muted-foreground text-sm">{label}</span>
    </div>
  );
}
