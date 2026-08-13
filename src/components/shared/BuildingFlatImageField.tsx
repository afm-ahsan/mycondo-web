import { useState } from 'react';
import { Image } from 'lucide-react';
import { toUserMessage } from '@/api/errors';
import { useGetApiV1AttachmentsQuery, usePostApiV1AttachmentsMutation } from '@/api/generated/mycondoApi';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { FileUpload, FileUploadListItem } from '@/components/ui/file-upload';
import { toApiError } from '@/lib/forms/applyApiErrorToForm';

interface BuildingFlatImageFieldProps {
  ownerType: 'Building' | 'Flat';
  ownerId: string;
  primaryPhotoAttachmentId: string | null;
  onSetPrimaryPhoto: (attachmentId: string | null) => Promise<unknown>;
}

/**
 * Primary-image field shared by the Building and Flat edit dialogs. mycondo-api's Attachments
 * feature is metadata-only today (no real object-storage upload path exists yet — see `Attachment`'s
 * doc comment); this records file metadata against a synthetic storage key and says so plainly,
 * the same disclosed-gap pattern `DocumentsStep` uses for tenant-registration documents, rather than
 * pretending a real image preview is available.
 */
export function BuildingFlatImageField({
  ownerType,
  ownerId,
  primaryPhotoAttachmentId,
  onSetPrimaryPhoto,
}: BuildingFlatImageFieldProps) {
  const { data: attachments } = useGetApiV1AttachmentsQuery({ ownerType, ownerId });
  const [recordAttachment] = usePostApiV1AttachmentsMutation();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The caller's `primaryPhotoAttachmentId` is a snapshot taken when the dialog opened and won't
  // necessarily re-render with the mutation result while this dialog stays open, so track the latest
  // value locally once the user has acted, rather than trusting the prop for the dialog's lifetime.
  const [localAttachmentId, setLocalAttachmentId] = useState<string | null | undefined>(undefined);
  const currentAttachmentId = localAttachmentId !== undefined ? localAttachmentId : primaryPhotoAttachmentId;

  const currentAttachment = attachments?.find((a) => a.attachmentId === currentAttachmentId);

  async function handleFiles(files: File[]) {
    const file = files[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);
    try {
      const recorded = await recordAttachment({
        recordAttachmentCommand: {
          ownerType,
          ownerId,
          storageKey: `local/${ownerId}/${crypto.randomUUID()}-${file.name}`,
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
        },
      }).unwrap();
      await onSetPrimaryPhoto(recorded.attachmentId);
      setLocalAttachmentId(recorded.attachmentId);
    } catch (err) {
      setError(toUserMessage(toApiError(err) ?? err));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemove() {
    setError(null);
    try {
      await onSetPrimaryPhoto(null);
      setLocalAttachmentId(null);
    } catch (err) {
      setError(toUserMessage(toApiError(err) ?? err));
    }
  }

  return (
    <div className="space-y-2 border-t pt-4">
      <p className="text-sm font-medium">Image</p>
      <Alert appearance="light">
        <AlertIcon>
          <Image />
        </AlertIcon>
        <AlertTitle>
          Image storage isn't connected yet — the file name is recorded, but the file itself isn't
          uploaded anywhere, so no visual preview is available.
        </AlertTitle>
      </Alert>

      {error && (
        <Alert variant="destructive" appearance="light" onClose={() => setError(null)}>
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}

      <FileUpload
        onFilesSelected={handleFiles}
        multiple={false}
        accept="image/*"
        disabled={isUploading}
        label={isUploading ? 'Uploading…' : currentAttachment ? 'Click to replace the image' : 'Click to upload an image'}
        hint="JPG or PNG"
      />

      {currentAttachment && (
        <FileUploadListItem fileName={currentAttachment.fileName} status="uploaded" onRemove={handleRemove} />
      )}
    </div>
  );
}
