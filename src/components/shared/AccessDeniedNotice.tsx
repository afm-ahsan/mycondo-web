import { ShieldOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function AccessDeniedNotice() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
      <ShieldOff className="text-muted-foreground size-8" aria-hidden="true" />
      <h2 className="text-lg font-semibold">Access denied</h2>
      <p className="text-muted-foreground max-w-sm text-sm">
        You don&apos;t have permission to view this page. Contact your administrator if you believe
        this is a mistake.
      </p>
      <Button variant="outline" size="sm" className="mt-1" asChild>
        <Link to="/">Back to dashboard</Link>
      </Button>
    </div>
  );
}
