import { useEffect, useState } from 'react';
import { useGetAttachmentContentBlobQuery } from '../api/attachmentsApi';

/**
 * See attachmentsApi.ts's `getAttachmentContentBlob` comment — attachments aren't public URLs, so
 * this fetches the bytes as a blob and hands back a local object URL, revoked on cleanup/change.
 */
export function useAttachmentContentUrl(attachmentId: string | null | undefined): string | null {
  const { data: blob } = useGetAttachmentContentBlobQuery(attachmentId ?? '', { skip: !attachmentId });
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(blob);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  return objectUrl;
}
