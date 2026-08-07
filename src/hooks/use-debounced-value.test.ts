import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDebouncedValue } from './use-debounced-value';

describe('useDebouncedValue', () => {
  it('returns the initial value immediately, without waiting for the delay', () => {
    const { result } = renderHook(() => useDebouncedValue('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('delays reflecting a changed value until the delay elapses', () => {
    vi.useFakeTimers();
    try {
      const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
        initialProps: { value: 'a' },
      });

      rerender({ value: 'ab' });
      expect(result.current).toBe('a');

      act(() => {
        vi.advanceTimersByTime(299);
      });
      expect(result.current).toBe('a');

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(result.current).toBe('ab');
    } finally {
      vi.useRealTimers();
    }
  });

  it('only commits the last value when it changes again before the delay elapses', () => {
    vi.useFakeTimers();
    try {
      const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
        initialProps: { value: 'a' },
      });

      rerender({ value: 'ab' });
      act(() => {
        vi.advanceTimersByTime(150);
      });
      rerender({ value: 'abc' });
      act(() => {
        vi.advanceTimersByTime(150);
      });
      // Only 150ms since the second change — the first change's timer never fires.
      expect(result.current).toBe('a');

      act(() => {
        vi.advanceTimersByTime(150);
      });
      expect(result.current).toBe('abc');
    } finally {
      vi.useRealTimers();
    }
  });
});
