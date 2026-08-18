import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  beginHttpRequest,
  endHttpRequest,
  getActiveHttpOperation,
  getActiveHttpRequestCount,
  resetHttpRequestActivityForTests,
  useActiveHttpOperation,
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

describe('operation-aware tracking', () => {
  it('is null when idle and defaults a no-arg begin to load', () => {
    expect(getActiveHttpOperation()).toBeNull();
    const { result } = renderHook(() => useActiveHttpOperation());
    expect(result.current).toBeNull();

    act(() => beginHttpRequest());
    expect(result.current).toBe('load');

    act(() => endHttpRequest());
    expect(result.current).toBeNull();
  });

  it('reports each operation correctly for a single in-flight request', () => {
    for (const operation of ['load', 'save', 'update', 'delete', 'search'] as const) {
      act(() => beginHttpRequest(operation));
      expect(getActiveHttpOperation()).toBe(operation);
      act(() => endHttpRequest(operation));
      expect(getActiveHttpOperation()).toBeNull();
    }
  });

  it('prioritizes update over a concurrent background load', () => {
    act(() => {
      beginHttpRequest('load');
      beginHttpRequest('update');
    });
    expect(getActiveHttpOperation()).toBe('update');
  });

  it('prioritizes delete over a concurrent update', () => {
    act(() => {
      beginHttpRequest('update');
      beginHttpRequest('delete');
    });
    expect(getActiveHttpOperation()).toBe('delete');
  });

  it('prioritizes update over save and search over load', () => {
    act(() => {
      beginHttpRequest('save');
      beginHttpRequest('search');
      beginHttpRequest('load');
    });
    expect(getActiveHttpOperation()).toBe('save');

    act(() => endHttpRequest('save'));
    expect(getActiveHttpOperation()).toBe('search');

    act(() => endHttpRequest('search'));
    expect(getActiveHttpOperation()).toBe('load');
  });

  it('falls back to the remaining operation once the higher-priority one finishes', () => {
    act(() => {
      beginHttpRequest('load');
      beginHttpRequest('delete');
    });
    expect(getActiveHttpOperation()).toBe('delete');

    act(() => endHttpRequest('delete'));
    expect(getActiveHttpOperation()).toBe('load');

    act(() => endHttpRequest('load'));
    expect(getActiveHttpOperation()).toBeNull();
  });
});
