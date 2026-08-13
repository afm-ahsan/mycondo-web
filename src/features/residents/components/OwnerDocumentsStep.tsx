import { useState } from 'react';
import { AlertCircle, Image } from 'lucide-react';
import { toUserMessage } from '@/api/errors';
import { useGetApiV1AttachmentsQuery, usePostApiV1AttachmentsMutation } from '@/api/generated/mycondoApi';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FileUpload, FileUploadListItem } from '@/components/ui/file-upload';
import { toApiError } from '@/lib/forms/applyApiErrorToForm';

interface OwnerDocumentsStepProps {
  residentId: string;
  onFinish: () => void;
}

/**
 * Step 5 — owner documents (ownership/deed, NID/passport copy, photograph), recorded against the
 * Resident created in Step 4. mycondo-api's Attachments feature is metadata-only today (no real
 * object-storage upload path exists yet — see `Attachment`'s doc comment); this records file metadata
 * (name/type/size) rather than fabricating a real upload, and says so plainly, matching the same
 * disclosed-gap pattern `DocumentsStep` uses for Tenant Registration.
 */
export function OwnerDocumentsStep({ residentId, onFinish }: OwnerDocumentsStepProps) {
  const { data: documents, isLoading: isLoadingDocs } = useGetApiV1AttachmentsQuery({
    ownerType: 'Resident',
    ownerId: residentId,
  });
  const [recordDocument] = usePostApiV1AttachmentsMutation();
  const [error, setError] = useState<string | null>(null);
  const [uploadingNames, setUploadingNames] = useState<string[]>([]);

  async function handleFiles(files: File[]) {
    setError(null);
    setUploadingNames((prev) => [...prev, ...files.map((f) => f.name)]);

    for (const file of files) {
      try {
        await recordDocument({
          recordAttachmentCommand: {
            ownerType: 'Resident',
            ownerId: residentId,
            storageKey: `local/${residentId}/${crypto.randomUUID()}-${file.name}`,
            fileName: file.name,
            contentType: file.type || 'application/octet-stream',
            sizeBytes: file.size,
          },
        }).unwrap();
      } catch (err) {
        setError(toUserMessage(toApiError(err) ?? err));
      } finally {
        setUploadingNames((prev) => prev.filter((n) => n !== file.name));
      }
    }
  }

  return (
    <div className="space-y-4">
      <Alert appearance="light">
        <AlertIcon>
          <Image />
        </AlertIcon>
        <AlertTitle>
          Document storage isn't connected yet — file names and details are recorded, but the files
          themselves are not uploaded anywhere. Bring the physical/scanned copy for verification.
        </AlertTitle>
      </Alert>

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
        label="Click to add ownership document / NID / passport / owner photo"
        hint="Deed copy, NID, passport, or owner photograph"
      />

      <div className="space-y-2">
        {uploadingNames.map((name) => (
          <FileUploadListItem key={name} fileName={name} status="uploading" />
        ))}
        {isLoadingDocs ? (
          <p className="text-muted-foreground text-sm">Loading documents…</p>
        ) : (
          documents?.map((doc) => <FileUploadListItem key={doc.attachmentId} fileName={doc.fileName} status="uploaded" />)
        )}
      </div>

      <div className="flex gap-2 border-t pt-4">
        <Button type="button" onClick={onFinish}>
          Finish
        </Button>
      </div>
    </div>
  );
}
