import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  beginHttpRequest,
  endHttpRequest,
  resetHttpRequestActivityForTests,
} from '@/lib/http/requestActivityTracker';
import { HttpInertBoundary } from './http-inert-boundary';

afterEach(() => {
  resetHttpRequestActivityForTests();
});

describe('HttpInertBoundary', () => {
  it('does not mark its children inert while no request is in flight', () => {
    render(
      <HttpInertBoundary>
        <button>Save</button>
      </HttpInertBoundary>,
    );

    expect(screen.getByRole('button', { name: 'Save' }).closest('[inert]')).toBeNull();
  });

  it('marks its children inert while a request is active, and clears it once settled', () => {
    render(
      <HttpInertBoundary>
        <button>Save</button>
      </HttpInertBoundary>,
    );

    act(() => beginHttpRequest());
    expect(screen.getByRole('button', { name: 'Save' }).closest('[inert]')).not.toBeNull();

    act(() => endHttpRequest());
    expect(screen.getByRole('button', { name: 'Save' }).closest('[inert]')).toBeNull();
  });

  it('does not add layout structure (display: contents wrapper)', () => {
    render(
      <HttpInertBoundary>
        <button>Save</button>
      </HttpInertBoundary>,
    );

    const wrapper = screen.getByRole('button', { name: 'Save' }).parentElement;
    expect(wrapper?.className).toMatch(/contents/);
  });
});
