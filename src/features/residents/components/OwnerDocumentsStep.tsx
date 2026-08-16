import { AttachmentUploadPanel } from '@/features/attachments/components/AttachmentUploadPanel';
import { Button } from '@/components/ui/button';

interface OwnerDocumentsStepProps {
  residentId: string;
  onFinish: () => void;
}

/** Step 4 — owner documents (ownership/deed, NID/passport copy, photograph), recorded against the
 * Resident created in Step 2. */
export function OwnerDocumentsStep({ residentId, onFinish }: OwnerDocumentsStepProps) {
  return (
    <div className="space-y-4">
      <AttachmentUploadPanel
        ownerType="Resident"
        ownerId={residentId}
        accept="application/pdf,image/jpeg,image/png,image/webp"
        maxSizeMb={10}
        label="Click to add ownership document / NID / passport / owner photo"
        hint="Deed copy, NID, passport, or owner photograph · PDF, JPG, PNG or WebP · Maximum 10 MB"
      />

      <div className="flex gap-2 border-t pt-4">
        <Button type="button" onClick={onFinish}>
          Continue
        </Button>
      </div>
    </div>
  );
}
