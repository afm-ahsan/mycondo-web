import { useRef, useState, type ChangeEvent } from 'react';
import { Camera, X } from 'lucide-react';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import { Button } from '@/components/ui/button';
import { InlineSpinner } from '@/components/feedback/InlineSpinner';
import { toAbsoluteUrl } from '@/lib/helpers';
import { useAppDispatch } from '@/store/hooks';
import { profileUpdated } from '@/store/slices/authSlice';
import { useRemoveMyAvatar, useUploadMyAvatarMutation } from '@/features/auth/api/authApi';
import { useAvatarUrl } from '../hooks/useAvatarUrl';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const FALLBACK_AVATAR = toAbsoluteUrl('/media/avatars/blank.png');

interface AvatarSectionProps {
  avatarUrl: string | null | undefined;
}

export function AvatarSection({ avatarUrl }: AvatarSectionProps) {
  const dispatch = useAppDispatch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const uploadedAvatarSrc = useAvatarUrl(Boolean(avatarUrl));
  const [uploadAvatar, { isLoading: isUploading }] = useUploadMyAvatarMutation();
  const [removeAvatar, { isLoading: isRemoving }] = useRemoveMyAvatar();

  const isBusy = isUploading || isRemoving;
  const displaySrc = localPreview ?? uploadedAvatarSrc ?? FALLBACK_AVATAR;

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
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('Image must be 5 MB or smaller.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);

    try {
      const profile = await uploadAvatar(file).unwrap();
      dispatch(profileUpdated({ avatarUrl: profile.avatarUrl ?? null }));
      toast.success('Profile photo updated successfully.');
    } catch (err) {
      toast.error(toUserMessage(err));
    } finally {
      URL.revokeObjectURL(objectUrl);
      setLocalPreview(null);
    }
  }

  async function handleRemove() {
    try {
      const profile = await removeAvatar().unwrap();
      dispatch(profileUpdated({ avatarUrl: profile.avatarUrl ?? null }));
      toast.success('Profile photo removed successfully.');
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="relative size-24">
        {isBusy && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-full bg-background/70">
            <InlineSpinner className="size-6 text-muted-foreground" />
          </div>
        )}
        <img
          src={displaySrc}
          alt="Your profile photo"
          className="size-24 rounded-full border-2 border-green-500 object-cover"
        />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={handleFileSelected}
        aria-label="Choose a new profile photo"
      />

      <div className="flex flex-col gap-1.5 w-full max-w-40">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isBusy}
          onClick={() => inputRef.current?.click()}
        >
          <Camera /> Change Photo
        </Button>
        {avatarUrl && (
          <Button type="button" variant="ghost" size="sm" disabled={isBusy} onClick={handleRemove}>
            <X /> Remove Photo
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground max-w-48">JPG, PNG, or WebP. Maximum size: 5 MB.</p>
    </div>
  );
}
