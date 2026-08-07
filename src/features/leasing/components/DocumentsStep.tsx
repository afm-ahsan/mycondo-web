import { useState } from 'react';
import { AlertCircle, Image } from 'lucide-react';
import { toUserMessage } from '@/api/errors';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileUpload, FileUploadListItem } from '@/components/ui/file-upload';
import { toApiError } from '@/lib/forms/applyApiErrorToForm';
import {
  useRecordTenantRegistrationDocument,
  useSetTenantRegistrationPrimaryPhoto,
  useTenantRegistration,
  useTenantRegistrationDocuments,
} from '../api/leasingApi';

interface DocumentsStepProps {
  registrationId: string;
  onContinue: () => void;
  onBack: () => void;
}

/**
 * Step 4 — identity/lease documents and the primary photo. mycondo-api's Attachments feature is
 * metadata-only today (no real object-storage upload path exists yet — see `Attachment`'s doc
 * comment); this records file metadata (name/type/size) against a synthetic storage key rather than
 * fabricating a real upload, and says so plainly rather than pretending the file is stored anywhere.
 */
export function DocumentsStep({ registrationId, onContinue, onBack }: DocumentsStepProps) {
  const { data: registration } = useTenantRegistration({ id: registrationId });
  const { data: documents, isLoading: isLoadingDocs } = useTenantRegistrationDocuments({
    ownerType: 'OccupancyRegistration',
    ownerId: registrationId,
  });
  const [recordDocument] = useRecordTenantRegistrationDocument();
  const [setPrimaryPhoto] = useSetTenantRegistrationPrimaryPhoto();
  const [error, setError] = useState<string | null>(null);
  const [uploadingNames, setUploadingNames] = useState<string[]>([]);

  async function handleFiles(files: File[]) {
    setError(null);
    setUploadingNames((prev) => [...prev, ...files.map((f) => f.name)]);

    for (const file of files) {
      try {
        await recordDocument({
          recordAttachmentCommand: {
            ownerType: 'OccupancyRegistration',
            ownerId: registrationId,
            storageKey: `local/${registrationId}/${crypto.randomUUID()}-${file.name}`,
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
        label="Click to add identity document / lease document / photo"
        hint="NID, passport, lease agreement, or occupant photo"
      />

      <div className="space-y-2">
        {uploadingNames.map((name) => (
          <FileUploadListItem key={name} fileName={name} status="uploading" />
        ))}
        {isLoadingDocs ? (
          <p className="text-muted-foreground text-sm">Loading documents…</p>
        ) : (
          documents?.map((doc) => (
            <div key={doc.attachmentId} className="flex items-center gap-2">
              <FileUploadListItem fileName={doc.fileName} status="uploaded" />
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
