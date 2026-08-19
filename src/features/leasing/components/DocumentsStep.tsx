import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { toUserMessage } from '@/api/errors';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileUpload, FileUploadListItem } from '@/components/ui/file-upload';
import { useAttachmentsForOwner, useDeleteAttachment, useUploadAttachmentMutation } from '@/features/attachments/api/attachmentsApi';
import { toApiError } from '@/lib/forms/applyApiErrorToForm';
import { generateUUID } from '@/lib/helpers';
import { useSetTenantRegistrationPrimaryPhoto, useTenantRegistration } from '../api/leasingApi';

interface DocumentsStepProps {
  registrationId: string;
  onContinue: () => void;
  onBack: () => void;
}

interface PendingUpload {
  localId: string;
  file: File;
  status: 'uploading' | 'failed';
}

/** Step 4 — identity/lease documents and the primary photo. */
export function DocumentsStep({ registrationId, onContinue, onBack }: DocumentsStepProps) {
  const { data: registration } = useTenantRegistration({ id: registrationId });
  const { data: documents, isLoading: isLoadingDocs } = useAttachmentsForOwner({
    ownerType: 'OccupancyRegistration',
    ownerId: registrationId,
  });
  const [uploadAttachment] = useUploadAttachmentMutation();
  const [deleteAttachment] = useDeleteAttachment();
  const [setPrimaryPhoto] = useSetTenantRegistrationPrimaryPhoto();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingUpload[]>([]);

  async function uploadOne(entry: PendingUpload) {
    setPending((prev) => prev.map((p) => (p.localId === entry.localId ? { ...p, status: 'uploading' } : p)));
    try {
      await uploadAttachment({ file: entry.file, ownerType: 'OccupancyRegistration', ownerId: registrationId }).unwrap();
      setPending((prev) => prev.filter((p) => p.localId !== entry.localId));
    } catch (err) {
      setError(toUserMessage(toApiError(err) ?? err));
      setPending((prev) => prev.map((p) => (p.localId === entry.localId ? { ...p, status: 'failed' } : p)));
    }
  }

  function handleFiles(files: File[]) {
    setError(null);
    const entries: PendingUpload[] = files.map((file) => ({ localId: generateUUID(), file, status: 'uploading' }));
    setPending((prev) => [...prev, ...entries]);
    for (const entry of entries) {
      void uploadOne(entry);
    }
  }

  async function handleRemove(attachmentId: string) {
    setError(null);
    try {
      await deleteAttachment({ attachmentId }).unwrap();
    } catch (err) {
      setError(toUserMessage(toApiError(err) ?? err));
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" appearance="light" onClose={() => setError(null)}>
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}

      <FileUpload
        onFilesSelected={handleFiles}
        accept="application/pdf,image/jpeg,image/png,image/webp"
        label="Click to add identity document / lease document / photo"
        hint="NID, passport, lease agreement, or occupant photo · PDF, JPG, PNG or WebP · Maximum 10 MB"
      />

      <div className="space-y-2">
        {isLoadingDocs ? (
          <p className="text-muted-foreground text-sm">Loading documents…</p>
        ) : (
          documents?.map((doc) => (
            <div key={doc.attachmentId} className="flex items-center gap-2">
              <FileUploadListItem
                fileName={doc.fileName}
                status="uploaded"
                onRemove={() => handleRemove(doc.attachmentId)}
              />
              {registration?.primaryPhotoAttachmentId === doc.attachmentId ? (
                <Badge variant="primary" appearance="light">
                  Primary photo
                </Badge>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPrimaryPhoto({ id: registrationId, setPrimaryPhotoRequest: { attachmentId: doc.attachmentId } })}
                >
                  Set as photo
                </Button>
              )}
            </div>
          ))
        )}
        {pending.map((entry) => (
          <FileUploadListItem
            key={entry.localId}
            fileName={entry.file.name}
            status={entry.status}
            onRetry={() => uploadOne(entry)}
            onRemove={() => setPending((prev) => prev.filter((p) => p.localId !== entry.localId))}
          />
        ))}
      </div>

      <div className="flex gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
