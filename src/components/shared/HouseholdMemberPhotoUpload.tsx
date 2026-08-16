import { useRef, useState, type ChangeEvent } from 'react';
import { Camera, User, X } from 'lucide-react';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import { Button } from '@/components/ui/button';
import { InlineSpinner } from '@/components/feedback/InlineSpinner';
import { useAttachmentContentUrl } from '@/features/attachments/hooks/useAttachmentContentUrl';
import { useUploadAttachmentMutation } from '@/features/attachments/api/attachmentsApi';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface HouseholdMemberPhotoUploadProps {
  ownerType: 'ResidentHouseholdMember' | 'LeasingHouseholdMember';
  ownerId: string;
  primaryPhotoAttachmentId: string | null | undefined;
  onSetPrimaryPhoto: (attachmentId: string | null) => Promise<unknown>;
  disabled?: boolean;
}

/** Household member profile-photo control — generalizes features/me/components/AvatarSection.tsx's
 * upload/preview/change/remove UX for an arbitrary household member instead of the signed-in user's
 * own account. Uploads go through the shared generic Attachments endpoint (see AttachmentUploadPanel);
 * this only adds the "which uploaded attachment is the display photo" pointer on top, via
 * onSetPrimaryPhoto — reusing the same primary-photo pattern already used for
 * Building/Flat/OccupancyRegistration rather than a dedicated upload/replace endpoint. */
export function HouseholdMemberPhotoUpload({
  ownerType,
  ownerId,
  primaryPhotoAttachmentId,
  onSetPrimaryPhoto,
  disabled,
}: HouseholdMemberPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const uploadedPhotoUrl = useAttachmentContentUrl(primaryPhotoAttachmentId);
  const [uploadAttachment, { isLoading: isUploading }] = useUploadAttachmentMutation();
  const [isSettingPhoto, setIsSettingPhoto] = useState(false);

  const isBusy = isUploading || isSettingPhoto || Boolean(disabled);
  const displaySrc = localPreview ?? uploadedPhotoUrl;

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only JPG, PNG, or WebP images are allowed.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error('Image must be 5 MB or smaller.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);

    try {
      const attachment = await uploadAttachment({ file, ownerType, ownerId }).unwrap();
      setIsSettingPhoto(true);
      await onSetPrimaryPhoto(attachment.attachmentId);
      toast.success('Photo updated successfully.');
    } catch (err) {
      toast.error(toUserMessage(err));
    } finally {
      URL.revokeObjectURL(objectUrl);
      setLocalPreview(null);
      setIsSettingPhoto(false);
    }
  }

  async function handleRemove() {
    setIsSettingPhoto(true);
    try {
      await onSetPrimaryPhoto(null);
      toast.success('Photo removed successfully.');
    } catch (err) {
      toast.error(toUserMessage(err));
    } finally {
      setIsSettingPhoto(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="relative size-20">
        {isBusy && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-full bg-background/70">
            <InlineSpinner className="size-5 text-muted-foreground" />
          </div>
        )}
        {displaySrc ? (
          <img src={displaySrc} alt="Household member photo" className="size-20 rounded-full border object-cover" />
        ) : (
          <div className="flex size-20 items-center justify-center rounded-full border bg-muted">
            <User className="size-8 text-muted-foreground" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={handleFileSelected}
        aria-label="Choose a household member photo"
      />

      <div className="flex flex-col gap-1.5 w-full max-w-36">
        <Button type="button" variant="outline" size="sm" disabled={isBusy} onClick={() => inputRef.current?.click()}>
          <Camera /> {primaryPhotoAttachmentId ? 'Change Photo' : 'Upload Photo'}
        </Button>
        {primaryPhotoAttachmentId && (
          <Button type="button" variant="ghost" size="sm" disabled={isBusy} onClick={handleRemove}>
            <X /> Remove Photo
          </Button>
        )}
      </div>
    </div>
  );
}
