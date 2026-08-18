import { useSyncExternalStore } from 'react';
import type { HttpOperation } from './httpOperation';

/**
 * Centralized counter of in-flight application HTTP requests, broken down per semantic operation.
 * Incremented/decremented directly by the RTK Query base queries in src/api/baseApi.ts and
 * src/api/platformBaseApi.ts — the two choke points every application HTTP call passes through (every
 * generated/hand-authored endpoint injects into one of those two `createApi` instances; see
 * src/api/README.md). Module-level state rather than Redux: this is HTTP-infrastructure bookkeeping,
 * the same category as the access-token variables next to it in baseApi.ts, not application/domain
 * state — it shouldn't round-trip through a dispatch on every request start/end.
 */
let activeRequestCount = 0;
const operationCounts: Record<HttpOperation, number> = {
  load: 0,
  save: 0,
  update: 0,
  delete: 0,
  search: 0,
};
const listeners = new Set<() => void>();

// Priority order when multiple operations are in flight simultaneously — a user-initiated mutation
// must not be visually preempted by an incidental background GET. See mycondo-web loader spec
// "Concurrent Requests — Operation Priority": Deleting > Updating > Saving > Searching > Loading.
const OPERATION_PRIORITY: readonly HttpOperation[] = ['delete', 'update', 'save', 'search', 'load'];

function notify(): void {
  for (const listener of listeners) listener();
}

/**
 * Call once, synchronously, right before an application HTTP request starts. `silent` (see
 * httpOperation.ts's isSilentHttpRequest) still counts toward activeRequestCount — HttpInertBoundary
 * must keep blocking interaction — but is excluded from the per-operation counters GlobalHttpLoader
 * reads, so a request with a loading indicator of its own (e.g. the Sign In button) never also
 * triggers the floating "Loading…" overlay.
 */
export function beginHttpRequest(operation: HttpOperation = 'load', silent = false): void {
  activeRequestCount += 1;
  if (!silent) {
    operationCounts[operation] += 1;
  }
  notify();
}

/** Call once, in a `finally`, when that same request settles (success, error, or thrown exception). */
export function endHttpRequest(operation: HttpOperation = 'load', silent = false): void {
  activeRequestCount = Math.max(0, activeRequestCount - 1);
  if (!silent) {
    operationCounts[operation] = Math.max(0, operationCounts[operation] - 1);
  }
  notify();
}

export function getActiveHttpRequestCount(): number {
  return activeRequestCount;
}

/** The highest-priority in-flight operation, or `null` when idle. Non-hook read for tests/one-offs. */
export function getActiveHttpOperation(): HttpOperation | null {
  for (const operation of OPERATION_PRIORITY) {
    if (operationCounts[operation] > 0) return operation;
  }
  return null;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): boolean {
  return activeRequestCount > 0;
}

/** True while at least one application HTTP request is in flight — HttpInertBoundary's only input. */
export function useIsHttpRequestActive(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** The highest-priority in-flight operation, or `null` when idle — GlobalHttpLoader's only input. */
export function useActiveHttpOperation(): HttpOperation | null {
  return useSyncExternalStore(subscribe, getActiveHttpOperation, getActiveHttpOperation);
}

/** Test-only: resets all counters between tests so one test's unbalanced mock can't leak into the next. */
export function resetHttpRequestActivityForTests(): void {
  activeRequestCount = 0;
  for (const operation of OPERATION_PRIORITY) operationCounts[operation] = 0;
  notify();
}
