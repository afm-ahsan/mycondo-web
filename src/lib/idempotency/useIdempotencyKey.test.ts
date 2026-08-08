import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useIdempotencyKey } from './useIdempotencyKey';

describe('useIdempotencyKey', () => {
  it('keeps the same key across re-renders (no duplicate mutation from a rerender)', () => {
    const { result, rerender } = renderHook(() => useIdempotencyKey());
    const [firstKey] = result.current;

    rerender();
    rerender();

    const [keyAfterRerenders] = result.current;
    expect(keyAfterRerenders).toBe(firstKey);
  });

  it('generates a fresh key when reset is called, for the next distinct command', () => {
    const { result } = renderHook(() => useIdempotencyKey());
    const [firstKey] = result.current;

    act(() => {
      const [, reset] = result.current;
      reset();
    });

    const [keyAfterReset] = result.current;
    expect(keyAfterReset).not.toBe(firstKey);
  });

  it('produces a well-formed key suitable for a header value', () => {
    const { result } = renderHook(() => useIdempotencyKey());
    const [key] = result.current;

    expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});
