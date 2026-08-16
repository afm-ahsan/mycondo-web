import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { toUserMessage } from '@/api/errors';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { useAttachmentsForOwner, useUploadAttachmentMutation } from '@/features/attachments/api/attachmentsApi';
import { useAttachmentContentUrl } from '@/features/attachments/hooks/useAttachmentContentUrl';
import { toApiError } from '@/lib/forms/applyApiErrorToForm';

interface BuildingFlatImageFieldProps {
  ownerType: 'Building' | 'Flat';
  ownerId: string;
  primaryPhotoAttachmentId: string | null;
  onSetPrimaryPhoto: (attachmentId: string | null) => Promise<unknown>;
}

/** Primary-image field shared by the Building and Flat edit dialogs. */
export function BuildingFlatImageField({
  ownerType,
  ownerId,
  primaryPhotoAttachmentId,
  onSetPrimaryPhoto,
}: BuildingFlatImageFieldProps) {
  const { data: attachments } = useAttachmentsForOwner({ ownerType, ownerId });
  const [uploadAttachment] = useUploadAttachmentMutation();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The caller's `primaryPhotoAttachmentId` is a snapshot taken when the dialog opened and won't
  // necessarily re-render with the mutation result while this dialog stays open, so track the latest
  // value locally once the user has acted, rather than trusting the prop for the dialog's lifetime.
  const [localAttachmentId, setLocalAttachmentId] = useState<string | null | undefined>(undefined);
  const currentAttachmentId = localAttachmentId !== undefined ? localAttachmentId : primaryPhotoAttachmentId;

  const currentAttachment = attachments?.find((a) => a.attachmentId === currentAttachmentId);
  const previewUrl = useAttachmentContentUrl(currentAttachment?.attachmentId);

  async function handleFiles(files: File[]) {
    const file = files[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);
    try {
      const uploaded = await uploadAttachment({ file, ownerType, ownerId }).unwrap();
      await onSetPrimaryPhoto(uploaded.attachmentId);
      setLocalAttachmentId(uploaded.attachmentId);
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

      {error && (
        <Alert variant="destructive" appearance="light" onClose={() => setError(null)}>
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}

      {currentAttachment && (
        <div className="flex items-center gap-3">
          {previewUrl && (
            <img
              src={previewUrl}
              alt={currentAttachment.fileName}
              className="border-border size-20 rounded-md border object-cover"
            />
          )}
          <div className="flex-1 truncate text-sm">{currentAttachment.fileName}</div>
          <Button type="button" variant="outline" size="sm" onClick={handleRemove}>
            Remove
          </Button>
        </div>
      )}

      <FileUpload
        onFilesSelected={handleFiles}
        multiple={false}
        accept="image/jpeg,image/png,image/webp"
        disabled={isUploading}
        label={isUploading ? 'Uploading…' : currentAttachment ? 'Click to replace the image' : 'Click to upload an image'}
        hint="JPG, PNG, or WebP · Maximum 10 MB"
      />
    </div>
  );
}
