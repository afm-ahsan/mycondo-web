import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import {
  beginHttpRequest,
  endHttpRequest,
  resetHttpRequestActivityForTests,
} from '@/lib/http/requestActivityTracker';
import { GlobalHttpLoader } from './global-http-loader';

afterEach(() => {
  resetHttpRequestActivityForTests();
});

describe('GlobalHttpLoader', () => {
  it('renders nothing when no HTTP request is in flight', () => {
    render(<GlobalHttpLoader />);
    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument();
  });

  it('appears while a request is active and disappears once it settles', () => {
    render(<GlobalHttpLoader />);

    act(() => beginHttpRequest());
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();

    act(() => endHttpRequest());
    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument();
  });

  it('stays visible across two concurrent requests until the last one finishes', () => {
    render(<GlobalHttpLoader />);

    act(() => beginHttpRequest());
    act(() => beginHttpRequest());
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();

    act(() => endHttpRequest());
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();

    act(() => endHttpRequest());
    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument();
  });

  it('renders exactly one spinner even with multiple requests in flight', () => {
    render(<GlobalHttpLoader />);

    act(() => {
      beginHttpRequest();
      beginHttpRequest();
      beginHttpRequest();
    });

    expect(screen.getAllByRole('status', { name: 'Loading' })).toHaveLength(1);
  });

  it('renders a full-viewport overlay that does not opt out of pointer events (blocks clicks)', () => {
    render(<GlobalHttpLoader />);

    act(() => beginHttpRequest());

    const overlay = screen.getByRole('status', { name: 'Loading' });
    expect(overlay.className).not.toMatch(/pointer-events-none/);
    expect(overlay.className).toMatch(/fixed inset-0/);
  });

  it('does not block pointer events on the inner spinner visual itself', () => {
    render(<GlobalHttpLoader />);

    act(() => beginHttpRequest());

    const overlay = screen.getByRole('status', { name: 'Loading' });
    const pill = overlay.firstElementChild as HTMLElement;
    expect(pill.className).toMatch(/pointer-events-none/);
  });

  it('moves keyboard focus to the overlay on activation, away from a just-clicked button', async () => {
    const user = userEvent.setup();
    function Harness() {
      return (
        <>
          <button>Save</button>
          <GlobalHttpLoader />
        </>
      );
    }
    render(<Harness />);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    await user.click(saveButton);
    saveButton.focus();
    expect(document.activeElement).toBe(saveButton);

    act(() => beginHttpRequest());

    // A stray Enter/Space now lands on the (non-interactive) overlay, not the Save button.
    expect(document.activeElement).toBe(screen.getByRole('status', { name: 'Loading' }));
  });

  it('restores focus to the previously focused element once the request settles', () => {
    function Harness() {
      return (
        <>
          <button>Save</button>
          <GlobalHttpLoader />
        </>
      );
    }
    render(<Harness />);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    saveButton.focus();

    act(() => beginHttpRequest());
    expect(document.activeElement).toBe(screen.getByRole('status', { name: 'Loading' }));

    act(() => endHttpRequest());
    expect(document.activeElement).toBe(saveButton);
  });
});
