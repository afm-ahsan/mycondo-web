import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Persists list-page state (search, page, page size, status, building, date range, …) in the URL
 * query string instead of local component state, so a refresh, a "back" from a detail page, or a
 * shared link all land on the same filtered view instead of resetting to defaults.
 *
 * `defaults` should be a stable reference (a module-level constant, not an inline object literal) —
 * its values are also what gets omitted from the URL, so `?status=all` stays a clean `/list` rather
 * than growing forever as filters are set back to their default.
 *
 * Only put URL-shareable, non-sensitive list state here. Do not put: form field values, National
 * ID/other sensitive data, dialog/drawer open state, or anything that shouldn't survive a copy-pasted
 * link to a colleague.
 */
export function useUrlFilters<T extends Record<string, string>>(defaults: T) {
  const [searchParams, setSearchParams] = useSearchParams();

  const values = useMemo(() => {
    const result = { ...defaults };
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const raw = searchParams.get(key as string);
      if (raw !== null) {
        result[key] = raw as T[keyof T];
      }
    }
    return result;
  }, [searchParams, defaults]);

  const setValues = useCallback(
    (patch: Partial<T>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const key of Object.keys(patch) as (keyof T)[]) {
            const value = patch[key];
            if (value === undefined || value === defaults[key]) {
              next.delete(key as string);
            } else {
              next.set(key as string, value);
            }
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams, defaults],
  );

  return [values, setValues] as const;
}
