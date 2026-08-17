import { useGetAttachmentContentBlobQuery } from '../api/attachmentsApi';

/**
 * See attachmentsApi.ts's `getAttachmentContentBlob` comment — attachments aren't public URLs, so
 * that query fetches the bytes and hands back a local object URL (create/revoke lifecycle lives
 * there), so this hook is just a thin, friendlier wrapper around it.
 */
export function useAttachmentContentUrl(attachmentId: string | null | undefined): string | null {
  const { data: objectUrl } = useGetAttachmentContentBlobQuery(attachmentId ?? '', { skip: !attachmentId });
  return objectUrl ?? null;
}
