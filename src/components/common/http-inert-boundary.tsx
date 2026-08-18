'use client';

import type { ReactNode } from 'react';
import { useIsHttpRequestActive } from '@/lib/http/requestActivityTracker';

/**
 * Makes its children `inert` (unfocusable, untabbable, unclickable, hidden from assistive tech)
 * while an application HTTP request is in flight — the keyboard/focus counterpart to
 * GlobalHttpLoader's pointer-blocking overlay, removing the rest of the app from the tab order so
 * the user can't Tab into a control and activate it mid-request. `contents` keeps this wrapper out of
 * layout entirely, so it has no effect on the page's box structure.
 *
 * Wrap the app's main content with this (see App.tsx); leave GlobalHttpLoader and anything else that
 * must stay reachable while loading (e.g. Toaster) outside it. Radix components (Dialog, DropdownMenu,
 * Popover, ...) portal to document.body by default, so already-open portaled content sits outside
 * this boundary's DOM subtree and isn't covered by it — GlobalHttpLoader's focus-redirect-on-activate
 * is what closes that gap instead of a heavier custom focus-trap.
 */
export function HttpInertBoundary({ children }: { children: ReactNode }) {
  const isActive = useIsHttpRequestActive();

  return (
    <div className="contents" inert={isActive}>
      {children}
    </div>
  );
}
