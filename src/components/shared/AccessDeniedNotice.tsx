export function AccessDeniedNotice() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-2">
      <h2 className="text-lg font-semibold">Access denied</h2>
      <p className="text-sm text-muted-foreground">
        You don&apos;t have permission to view this page.
      </p>
    </div>
  );
}
