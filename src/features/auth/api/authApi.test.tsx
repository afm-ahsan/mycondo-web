import { HttpResponse, http } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { useAppSelector } from '@/store/hooks';
import { useGetMyAvatarBlobQuery } from './authApi';

const API_BASE = 'https://localhost:7219';

function Harness() {
  const { data } = useGetMyAvatarBlobQuery(undefined);
  const cacheEntry = useAppSelector((s) => s.api.queries['getMyAvatarBlob(undefined)']);
  return <span data-testid="result">{JSON.stringify({ data, cacheData: cacheEntry?.data })}</span>;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getMyAvatarBlob — Blob never reaches Redux', () => {
  it('caches a plain object-URL string instead of the fetched Blob, with no serializability warning', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/auth/me/avatar`, () =>
        new HttpResponse('fake-bytes', { headers: { 'Content-Type': 'image/jpeg' } }),
      ),
    );
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { store, getByTestId } = renderWithProviders(<Harness />);

    await waitFor(() => {
      expect(store.getState().api.queries['getMyAvatarBlob(undefined)']?.status).toBe('fulfilled');
    });

    const cached = store.getState().api.queries['getMyAvatarBlob(undefined)']?.data;
    expect(typeof cached).toBe('string');
    expect(cached).not.toBeInstanceOf(Blob);
    expect(() => JSON.stringify(store.getState().api)).not.toThrow();

    // Confirms it's actually reachable/rendered as a string, not just present in the store.
    expect(getByTestId('result').textContent).toContain(String(cached));

    const serializabilityWarning = consoleError.mock.calls.some((call) =>
      String(call[0]).includes('non-serializable value'),
    );
    expect(serializabilityWarning).toBe(false);
  });
});
