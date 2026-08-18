import { useSyncExternalStore } from 'react';

/**
 * Centralized counter of in-flight application HTTP requests. Incremented/decremented directly by
 * the RTK Query base queries in src/api/baseApi.ts and src/api/platformBaseApi.ts — the two choke
 * points every application HTTP call passes through (every generated/hand-authored endpoint injects
 * into one of those two `createApi` instances; see src/api/README.md). Module-level state rather than
 * Redux: this is HTTP-infrastructure bookkeeping, the same category as the access-token variables next
 * to it in baseApi.ts, not application/domain state — it shouldn't round-trip through a dispatch on
 * every request start/end.
 */
let activeRequestCount = 0;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

/** Call once, synchronously, right before an application HTTP request starts. */
export function beginHttpRequest(): void {
  activeRequestCount += 1;
  notify();
}

/** Call once, in a `finally`, when that same request settles (success, error, or thrown exception). */
export function endHttpRequest(): void {
  activeRequestCount = Math.max(0, activeRequestCount - 1);
  notify();
}

export function getActiveHttpRequestCount(): number {
  return activeRequestCount;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): boolean {
  return activeRequestCount > 0;
}

/** True while at least one application HTTP request is in flight — the global loader's only input. */
export function useIsHttpRequestActive(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Test-only: resets the counter between tests so one test's unbalanced mock can't leak into the next. */
export function resetHttpRequestActivityForTests(): void {
  activeRequestCount = 0;
  notify();
}
