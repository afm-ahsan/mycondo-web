import { useCallback, useState } from 'react';
import { generateUUID } from '@/lib/helpers';

/**
 * One idempotency key per logical financial command instance (see src/api/idempotentEndpoints.ts —
 * this key is what gets sent as the `X-Idempotency-Key` header). `useState(() => ...)`'s lazy
 * initializer generates the key exactly once per mount, so a re-render never produces a new key and
 * never causes a duplicate mutation. Callers must call `reset()` after a successful submit, or when
 * the owning dialog/form closes, so the *next* distinct command gets a fresh key — the same key must
 * never span two different user-initiated actions. Never render the key in the UI; it is a pure
 * transport concern.
 *
 * Retrying the *same* in-flight/failed attempt (the user clicks Confirm again without closing the
 * dialog) intentionally reuses the same key — this is what makes the retry safe: the backend
 * (`IdempotencyEndpointFilter`) recognizes a matching key + request body and returns the original
 * response instead of re-executing the command.
 */
export function useIdempotencyKey(): [string, () => void] {
  const [key, setKey] = useState(() => generateUUID());
  const reset = useCallback(() => setKey(generateUUID()), []);
  return [key, reset];
}
