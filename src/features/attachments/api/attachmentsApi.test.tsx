import { HttpResponse, http } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { useAppSelector } from '@/store/hooks';
import { useGetAttachmentContentBlobQuery } from './attachmentsApi';

const API_BASE = 'https://localhost:7219';
const ATTACHMENT_ID = 'attachment-1';

function Harness({ attachmentId }: { attachmentId: string }) {
  useGetAttachmentContentBlobQuery(attachmentId);
  const cacheData = useAppSelector((s) => s.api.queries[`getAttachmentContentBlob("${attachmentId}")`]?.data);
  return <span data-testid="result">{String(cacheData)}</span>;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getAttachmentContentBlob — Blob never reaches Redux', () => {
  it('caches a plain object-URL string instead of the fetched Blob, with no serializability warning', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/attachments/${ATTACHMENT_ID}/content`, () =>
        new HttpResponse('fake-bytes', { headers: { 'Content-Type': 'image/jpeg' } }),
      ),
    );
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { store, getByTestId } = renderWithProviders(<Harness attachmentId={ATTACHMENT_ID} />);

    const cacheKey = `getAttachmentContentBlob("${ATTACHMENT_ID}")`;
    await waitFor(() => {
      expect(store.getState().api.queries[cacheKey]?.status).toBe('fulfilled');
    });

    const cached = store.getState().api.queries[cacheKey]?.data;
    expect(typeof cached).toBe('string');
    expect(cached).not.toBeInstanceOf(Blob);
    expect(() => JSON.stringify(store.getState().api)).not.toThrow();
    expect(getByTestId('result').textContent).toBe(String(cached));

    const serializabilityWarning = consoleError.mock.calls.some((call) =>
      String(call[0]).includes('non-serializable value'),
    );
    expect(serializabilityWarning).toBe(false);
  });
});
