import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, useSearchParams } from 'react-router-dom';
import { useUrlFilters } from './use-url-filters';

const DEFAULTS = { search: '', page: '1', pageSize: '10' };

function wrapper(initialEntries: string[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>;
  };
}

// Reads back the raw query string alongside the hook's parsed values, so assertions can check both
// "what the hook returns" and "what actually landed in the URL" in one render.
function useFiltersAndSearch() {
  const filters = useUrlFilters(DEFAULTS);
  const [searchParams] = useSearchParams();
  return { filters, search: searchParams.toString() };
}

describe('useUrlFilters', () => {
  it('falls back to defaults when the URL has no query string', () => {
    const { result } = renderHook(() => useFiltersAndSearch(), { wrapper: wrapper(['/list']) });
    expect(result.current.filters[0]).toEqual(DEFAULTS);
  });

  it('reads existing values out of the URL on mount', () => {
    const { result } = renderHook(() => useFiltersAndSearch(), {
      wrapper: wrapper(['/list?search=john&page=3']),
    });
    expect(result.current.filters[0]).toEqual({ search: 'john', page: '3', pageSize: '10' });
  });

  it('writes a changed value into the URL and omits keys left at their default', () => {
    const { result } = renderHook(() => useFiltersAndSearch(), { wrapper: wrapper(['/list']) });

    act(() => {
      result.current.filters[1]({ search: 'jane', page: '2' });
    });

    expect(result.current.filters[0]).toEqual({ search: 'jane', page: '2', pageSize: '10' });
    expect(result.current.search).toBe('search=jane&page=2');
  });

  it('removes a key from the URL when it is set back to its default', () => {
    const { result } = renderHook(() => useFiltersAndSearch(), {
      wrapper: wrapper(['/list?search=jane&page=2']),
    });

    act(() => {
      result.current.filters[1]({ page: '1' });
    });

    expect(result.current.search).toBe('search=jane');
  });

  it('merges a patch without clobbering keys it does not mention', () => {
    const { result } = renderHook(() => useFiltersAndSearch(), {
      wrapper: wrapper(['/list?search=jane']),
    });

    act(() => {
      result.current.filters[1]({ page: '2' });
    });

    expect(result.current.filters[0]).toEqual({ search: 'jane', page: '2', pageSize: '10' });
  });
});
