'use client';

import { useEffect, useRef } from 'react';
import { LoaderCircleIcon } from 'lucide-react';
import { useIsHttpRequestActive } from '@/lib/http/requestActivityTracker';

/**
 * Renders whenever any application HTTP request is in flight — driven solely by the centralized
 * activeRequestCount in requestActivityTracker.ts (incremented/decremented by baseApi.ts and
 * platformBaseApi.ts around every fetch, including auth/refresh/upload/download), never by an
 * individual page/component's own `isLoading`. Mount once at the application shell (see App.tsx).
 *
 * Deliberately blocking: the outer element is a full-viewport `fixed inset-0` div with no
 * `pointer-events-none`, so it sits on top of (and intercepts clicks on) everything beneath it —
 * including Radix-portaled dialogs/dropdowns, since pointer capture is purely a stacking-order
 * question and doesn't depend on DOM ancestry. Only the inner spinner pill opts back out of pointer
 * events (nothing inside it needs to be clickable).
 *
 * Mouse blocking alone doesn't stop a stray Enter/Space on whatever was already focused when the
 * request started (e.g. a just-clicked Save button), so on activation focus is redirected to the
 * overlay itself and restored to the original element once the request settles. This is the
 * keyboard-side counterpart to HttpInertBoundary, which removes the rest of the app from the tab
 * order for the same duration — see that file for why both are needed (Radix portals to
 * document.body, outside HttpInertBoundary's subtree, so this focus redirect is what actually covers
 * dialog/dropdown content).
 */
export function GlobalHttpLoader() {
  const isActive = useIsHttpRequestActive();
  const overlayRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isActive) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      overlayRef.current?.focus();
      return;
    }

    const previouslyFocused = previouslyFocusedRef.current;
    previouslyFocusedRef.current = null;
    if (previouslyFocused && document.contains(previouslyFocused)) {
      previouslyFocused.focus();
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div
      ref={overlayRef}
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex cursor-wait items-center justify-center outline-none"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="pointer-events-none flex items-center gap-2 rounded-full border border-border bg-background/95 px-4 py-2 shadow-lg shadow-black/10 backdrop-blur-sm">
        <LoaderCircleIcon className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
        <span className="text-sm font-medium text-foreground">Loading…</span>
      </div>
    </div>
  );
}
