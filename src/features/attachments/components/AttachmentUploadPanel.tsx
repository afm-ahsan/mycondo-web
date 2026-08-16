import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { toUserMessage } from '@/api/errors';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { FileUpload, FileUploadListItem } from '@/components/ui/file-upload';
import { InlineSpinner } from '@/components/feedback/InlineSpinner';
import { toApiError } from '@/lib/forms/applyApiErrorToForm';
import { useAttachmentsForOwner, useDeleteAttachment, useUploadAttachmentMutation } from '../api/attachmentsApi';

interface PendingUpload {
  localId: string;
  file: File;
  status: 'uploading' | 'failed';
  error?: string;
}

interface AttachmentUploadPanelProps {
  ownerType: string;
  ownerId: string;
  accept?: string;
  maxSizeMb?: number;
  label?: string;
  hint?: string;
  multiple?: boolean;
  className?: string;
}

/**
 * Shared document/image upload surface — consolidates the select→upload→status-track→retry/remove
 * loop that used to be hand-rolled per feature (Owner documents, Tenant documents, Building/Flat
 * image). Real bytes go to mycondo-api's Attachments upload endpoint; the backend is authoritative
 * for type/size validation (see UploadAttachmentCommandValidator) — maxSizeMb here is a client-side
 * UX shortcut only, to avoid a pointless round trip for an obviously oversized file.
 */
export function AttachmentUploadPanel({
  ownerType,
  ownerId,
  accept,
  maxSizeMb,
  label,
  hint,
  multiple = true,
  className,
}: AttachmentUploadPanelProps) {
  const { data: existingDocuments, isLoading: isLoadingDocs } = useAttachmentsForOwner({ ownerType, ownerId });
  const [uploadAttachment] = useUploadAttachmentMutation();
  const [deleteAttachment] = useDeleteAttachment();
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function uploadOne(entry: PendingUpload) {
    setPending((prev) => prev.map((p) => (p.localId === entry.localId ? { ...p, status: 'uploading', error: undefined } : p)));
    try {
      await uploadAttachment({ file: entry.file, ownerType, ownerId }).unwrap();
      setPending((prev) => prev.filter((p) => p.localId !== entry.localId));
    } catch (err) {
      const message = toUserMessage(toApiError(err) ?? err);
      setPending((prev) => prev.map((p) => (p.localId === entry.localId ? { ...p, status: 'failed', error: message } : p)));
    }
  }

  function handleFiles(files: File[]) {
    setError(null);
    const oversized = maxSizeMb ? files.filter((f) => f.size > maxSizeMb * 1024 * 1024) : [];
    if (oversized.length > 0) {
      setError(`${oversized.map((f) => f.name).join(', ')} exceed${oversized.length === 1 ? 's' : ''} the ${maxSizeMb} MB limit.`);
    }

    const accepted = files.filter((f) => !oversized.includes(f));
    const entries: PendingUpload[] = accepted.map((file) => ({ localId: crypto.randomUUID(), file, status: 'uploading' }));
    setPending((prev) => [...prev, ...entries]);
    for (const entry of entries) {
      void uploadOne(entry);
    }
  }

  async function handleRemoveExisting(attachmentId: string) {
    setError(null);
    try {
      await deleteAttachment({ attachmentId }).unwrap();
    } catch (err) {
      setError(toUserMessage(toApiError(err) ?? err));
    }
  }

  function handleRemovePending(localId: string) {
    setPending((prev) => prev.filter((p) => p.localId !== localId));
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {error && (
          <Alert variant="destructive" appearance="light" onClose={() => setError(null)}>
            <AlertIcon>
              <AlertCircle />
            </AlertIcon>
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        <FileUpload onFilesSelected={handleFiles} accept={accept} multiple={multiple} label={label} hint={hint} />

        <div className="space-y-2">
          {isLoadingDocs ? (
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              <InlineSpinner /> Loading documents…
            </p>
          ) : (
            existingDocuments?.map((doc) => (
              <FileUploadListItem
                key={doc.attachmentId}
                fileName={doc.fileName}
                status="uploaded"
                onRemove={() => handleRemoveExisting(doc.attachmentId)}
              />
            ))
          )}
          {pending.map((entry) => (
            <FileUploadListItem
              key={entry.localId}
              fileName={entry.file.name}
              status={entry.status}
              onRetry={() => uploadOne(entry)}
              onRemove={() => handleRemovePending(entry.localId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
