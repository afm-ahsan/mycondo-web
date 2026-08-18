import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  beginHttpRequest,
  endHttpRequest,
  getActiveHttpRequestCount,
  resetHttpRequestActivityForTests,
  useIsHttpRequestActive,
} from './requestActivityTracker';

afterEach(() => {
  resetHttpRequestActivityForTests();
});

describe('requestActivityTracker', () => {
  it('starts at zero with the loader inactive', () => {
    expect(getActiveHttpRequestCount()).toBe(0);
    const { result } = renderHook(() => useIsHttpRequestActive());
    expect(result.current).toBe(false);
  });

  it('activates on the first begin and stays active while more requests are in flight', () => {
    const { result } = renderHook(() => useIsHttpRequestActive());

    act(() => beginHttpRequest());
    expect(result.current).toBe(true);
    expect(getActiveHttpRequestCount()).toBe(1);

    // Request B starts while A is still in flight.
    act(() => beginHttpRequest());
    expect(getActiveHttpRequestCount()).toBe(2);

    // A finishes — B is still outstanding, so the loader must remain visible.
    act(() => endHttpRequest());
    expect(getActiveHttpRequestCount()).toBe(1);
    expect(result.current).toBe(true);

    // B finishes — only now should the loader hide.
    act(() => endHttpRequest());
    expect(getActiveHttpRequestCount()).toBe(0);
    expect(result.current).toBe(false);
  });

  it('handles three or more overlapping requests', () => {
    act(() => {
      beginHttpRequest();
      beginHttpRequest();
      beginHttpRequest();
    });
    expect(getActiveHttpRequestCount()).toBe(3);

    act(() => endHttpRequest());
    expect(getActiveHttpRequestCount()).toBe(2);
    act(() => endHttpRequest());
    expect(getActiveHttpRequestCount()).toBe(1);
    act(() => endHttpRequest());
    expect(getActiveHttpRequestCount()).toBe(0);
  });

  it('never goes negative on an unbalanced end', () => {
    act(() => endHttpRequest());
    expect(getActiveHttpRequestCount()).toBe(0);

    act(() => beginHttpRequest());
    act(() => endHttpRequest());
    act(() => endHttpRequest());
    expect(getActiveHttpRequestCount()).toBe(0);
  });
});
