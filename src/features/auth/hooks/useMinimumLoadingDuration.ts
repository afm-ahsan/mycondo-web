import { useEffect, useRef, useState } from 'react';

/**
 * On localhost, a request can resolve within a single paint frame — the loading flag flips
 * true then false before the browser ever paints it, so the spinner never becomes visible.
 * Turning on stays immediate (mirrors `active` directly); turning off is held for at least
 * `minMs` from when it turned on, so a fast response still reads as a perceptible spinner.
 */
export function useMinimumLoadingDuration(active: boolean, minMs = 300): boolean {
  const [holding, setHolding] = useState(false);
  const shownAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (active) {
      shownAtRef.current = Date.now();
      setHolding(false);
      return;
    }

    const shownAt = shownAtRef.current;
    if (shownAt === null) {
      return;
    }

    const remaining = minMs - (Date.now() - shownAt);
    if (remaining <= 0) {
      shownAtRef.current = null;
      return;
    }

    setHolding(true);
    const timer = setTimeout(() => {
      shownAtRef.current = null;
      setHolding(false);
    }, remaining);

    return () => clearTimeout(timer);
  }, [active, minMs]);

  return active || holding;
}
