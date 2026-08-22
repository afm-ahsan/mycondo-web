import { Button } from '@/components/ui/button';
import { HouseholdMemberPhotoUpload } from '@/components/shared/HouseholdMemberPhotoUpload';
import { AttachmentUploadPanel } from '@/features/attachments/components/AttachmentUploadPanel';
import { useSetTenantRegistrationPrimaryPhoto, useTenantRegistration } from '../api/leasingApi';

interface DocumentsStepProps {
  registrationId: string;
  onContinue: () => void;
  onBack: () => void;
}

/** Step 4 — identity/lease documents and the primary photo. Reuses the same preview/upload
 * surface as the Household Spouse/Child edit mode (AttachmentUploadPanel + HouseholdMemberPhotoUpload)
 * so existing and newly-picked files get thumbnail/"View" preview here too. */
export function DocumentsStep({ registrationId, onContinue, onBack }: DocumentsStepProps) {
  const { data: registration } = useTenantRegistration({ id: registrationId });
  const [setPrimaryPhoto] = useSetTenantRegistrationPrimaryPhoto();

  return (
    <div className="space-y-6">
      <HouseholdMemberPhotoUpload
        ownerType="OccupancyRegistration"
        ownerId={registrationId}
        primaryPhotoAttachmentId={registration?.primaryPhotoAttachmentId}
        onSetPrimaryPhoto={(attachmentId) =>
          setPrimaryPhoto({ id: registrationId, setPrimaryPhotoRequest: { attachmentId } }).unwrap()
        }
      />

      <AttachmentUploadPanel
        ownerType="OccupancyRegistration"
        ownerId={registrationId}
        excludeAttachmentIds={registration?.primaryPhotoAttachmentId ? [registration.primaryPhotoAttachmentId] : undefined}
        accept="image/jpeg,image/png,image/webp,application/pdf"
        maxSizeMb={10}
        label="Click to add identity document / lease document"
        hint="NID, passport, or lease agreement · PDF, JPG, PNG or WebP · Maximum 10 MB"
      />

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
