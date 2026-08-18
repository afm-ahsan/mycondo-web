import { useSyncExternalStore } from 'react';

/**
 * Centralized ref-count of currently-mounted CondoBD branded loaders (ScreenLoader — see
 * components/common/screen-loader.tsx), used solely to give the branded loader visual priority over
 * GlobalHttpLoader (global-http-loader.tsx) so the two never render at once. Mirrors
 * requestActivityTracker.ts's module-level external-store shape rather than routing this through
 * Redux: it's presentation coordination, not application/domain state.
 */
let activeBrandedLoaderCount = 0;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

/** Call once, synchronously, when a branded loader (ScreenLoader) mounts. */
export function beginBrandedLoader(): void {
  activeBrandedLoaderCount += 1;
  notify();
}

/** Call once, when that same branded loader unmounts. */
export function endBrandedLoader(): void {
  activeBrandedLoaderCount = Math.max(0, activeBrandedLoaderCount - 1);
  notify();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): boolean {
  return activeBrandedLoaderCount > 0;
}

/** True while at least one CondoBD branded loader is mounted — GlobalHttpLoader's suppression input. */
export function useIsBrandedLoaderActive(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Test-only: resets the count between tests so one test's unbalanced mount/unmount can't leak into the next. */
export function resetBrandedLoaderActivityForTests(): void {
  activeBrandedLoaderCount = 0;
  notify();
}
