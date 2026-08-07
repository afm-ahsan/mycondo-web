import { useEffect, useState } from 'react';

/**
 * Delays reflecting `value` until it's stayed unchanged for `delayMs` — the shared debounce for
 * every search input in the app, so a keystroke doesn't fire a network request on its own. Reset
 * pagination to the first page in the same effect/handler that changes the *raw* (non-debounced)
 * value the caller feeds in here, not on the debounced output, or the reset will itself lag by
 * `delayMs`.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}
