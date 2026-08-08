import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUnsavedChangesGuard } from './use-unsaved-changes-guard';

describe('useUnsavedChangesGuard', () => {
  let addSpy: ReturnType<typeof vi.spyOn>;
  let removeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addSpy = vi.spyOn(window, 'addEventListener');
    removeSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('does not register a beforeunload listener while the form is clean', () => {
    renderHook(() => useUnsavedChangesGuard(false));
    expect(addSpy).not.toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('registers a beforeunload listener once the form becomes dirty', () => {
    const { rerender } = renderHook(({ dirty }) => useUnsavedChangesGuard(dirty), {
      initialProps: { dirty: false },
    });
    expect(addSpy).not.toHaveBeenCalledWith('beforeunload', expect.any(Function));

    rerender({ dirty: true });
    expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('prevents the default beforeunload behavior while dirty', () => {
    renderHook(() => useUnsavedChangesGuard(true));
    const handler = addSpy.mock.calls.find((call: unknown[]) => call[0] === 'beforeunload')?.[1] as (
      e: Partial<BeforeUnloadEvent>,
    ) => void;

    const event = { preventDefault: vi.fn(), returnValue: '' };
    handler(event);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('removes its listeners when the form becomes clean again', () => {
    const { rerender } = renderHook(({ dirty }) => useUnsavedChangesGuard(dirty), {
      initialProps: { dirty: true },
    });
    rerender({ dirty: false });
    expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
  });

  it('removes its listeners on unmount', () => {
    const { unmount } = renderHook(() => useUnsavedChangesGuard(true));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
  });
});
