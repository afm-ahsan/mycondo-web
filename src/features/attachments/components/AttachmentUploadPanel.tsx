import { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { toUserMessage } from '@/api/errors';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { FileUpload, FileUploadListItem } from '@/components/ui/file-upload';
import { InlineSpinner } from '@/components/feedback/InlineSpinner';
import { toApiError } from '@/lib/forms/applyApiErrorToForm';
import { generateUUID } from '@/lib/helpers';
import type { AttachmentDto } from '@/api/generated/mycondoApi';
import { useAttachmentContentUrl } from '../hooks/useAttachmentContentUrl';
import { useAttachmentsForOwner, useDeleteAttachment, useUploadAttachmentMutation } from '../api/attachmentsApi';

interface PendingUpload {
  localId: string;
  file: File;
  status: 'uploading' | 'failed';
  error?: string;
  /** Local blob URL so a just-picked file (image or PDF) is previewable before it finishes
   * uploading — created eagerly on selection since it's a cheap, local-only operation. */
  previewUrl: string;
}

/** One existing (already-uploaded) document row — a separate component because each row needs its own
 * `useAttachmentContentUrl` call to fetch its own preview, same primitive Household edit mode's
 * Spouse/Child photo preview uses (see HouseholdMemberCard/HouseholdMemberPhotoUpload). */
function ExistingAttachmentItem({ doc, onRemove }: { doc: AttachmentDto; onRemove: () => void }) {
  const previewUrl = useAttachmentContentUrl(doc.attachmentId);
  return (
    <FileUploadListItem
      fileName={doc.fileName}
      status="uploaded"
      onRemove={onRemove}
      previewUrl={previewUrl}
      isImage={doc.contentType.startsWith('image/')}
    />
  );
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
  /** Attachment ids to hide from the list — e.g. an owner's profile-photo attachment, which shares
   * this same ownerType/ownerId but is displayed separately (see HouseholdMemberPhotoUpload). */
  excludeAttachmentIds?: string[];
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
  excludeAttachmentIds,
}: AttachmentUploadPanelProps) {
  const { data: allDocuments, isLoading: isLoadingDocs } = useAttachmentsForOwner({ ownerType, ownerId });
  const existingDocuments = excludeAttachmentIds?.length
    ? allDocuments?.filter((doc) => !excludeAttachmentIds.includes(doc.attachmentId))
    : allDocuments;
  const [uploadAttachment] = useUploadAttachmentMutation();
  const [deleteAttachment] = useDeleteAttachment();
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Tracks every local blob URL created for a pending preview so it can be revoked once the file
  // finishes uploading, is removed, or the panel unmounts mid-upload — mirrors attachmentsApi.ts's own
  // create/revoke discipline for server-fetched blob URLs.
  const previewUrlsRef = useRef<Set<string>>(new Set());

  function revokePreviewUrl(url: string) {
    previewUrlsRef.current.delete(url);
    URL.revokeObjectURL(url);
  }

  useEffect(
    () => () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current.clear();
    },
    [],
  );

  async function uploadOne(entry: PendingUpload) {
    setPending((prev) => prev.map((p) => (p.localId === entry.localId ? { ...p, status: 'uploading', error: undefined } : p)));
    try {
      await uploadAttachment({ file: entry.file, ownerType, ownerId }).unwrap();
      setPending((prev) => prev.filter((p) => p.localId !== entry.localId));
      revokePreviewUrl(entry.previewUrl);
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
    const entries: PendingUpload[] = accepted.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);
      return { localId: generateUUID(), file, status: 'uploading', previewUrl };
    });
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
    setPending((prev) => {
      const entry = prev.find((p) => p.localId === localId);
      if (entry) revokePreviewUrl(entry.previewUrl);
      return prev.filter((p) => p.localId !== localId);
    });
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
              <ExistingAttachmentItem
                key={doc.attachmentId}
                doc={doc}
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
              previewUrl={entry.previewUrl}
              isImage={entry.file.type.startsWith('image/')}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
