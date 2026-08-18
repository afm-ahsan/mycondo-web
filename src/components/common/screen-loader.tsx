'use client';

import { useEffect } from 'react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { beginBrandedLoader, endBrandedLoader } from '@/lib/http/brandedLoaderTracker';

/**
 * Registers itself with brandedLoaderTracker for the duration it's mounted, so GlobalHttpLoader can
 * suppress itself while this is showing — the two must never render simultaneously (see
 * global-http-loader.tsx).
 */
export function ScreenLoader() {
  useEffect(() => {
    beginBrandedLoader();
    return () => endBrandedLoader();
  }, []);

  return (
    <div className="flex flex-col items-center gap-2 justify-center fixed inset-0 z-50 transition-opacity duration-700 ease-in-out">
      <img
        className="h-10 w-auto max-w-none"
        src={toAbsoluteUrl('/media/app/condobd-logo.png')}
        alt="CondoBD"
      />
      <div className="text-muted-foreground font-medium text-sm">
        Loading...
      </div>
    </div>
  );
}
