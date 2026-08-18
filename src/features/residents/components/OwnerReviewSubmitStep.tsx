import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import {
  useGetApiV1PropertiesBuildingsByBuildingIdFlatsAndFlatIdQuery,
  useGetApiV1PropertiesBuildingsByIdQuery,
} from '@/api/generated/mycondoApi';
import { toUserMessage } from '@/api/errors';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { toApiError } from '@/lib/forms/applyApiErrorToForm';
import { formatDate } from '@/lib/helpers';
import { useCreateFlatOwnership, useOwnerHouseholdMembers } from '../api/residentsApi';
import type { FlatOwnerRegistrationSchemaType } from '../schemas/flatOwnerRegistrationSchema';

interface OwnerReviewSubmitStepProps {
  form: UseFormReturn<FlatOwnerRegistrationSchemaType>;
  residentId: string;
  /** Edit mode: the FlatOwnership already exists (that's how we got here), so Submit must not try to
   * grant it again — that would just hit the duplicate-ownership 409. This step becomes a plain
   * "Done" that returns to the register. */
  isEditMode?: boolean;
  onBack: () => void;
  onRegistered: () => void;
}

/** Step 5 — read-only summary, then Submit grants the FlatOwnership (CreateFlatOwnershipCommand) for
 * the Resident already created and saved in Step 2. Unlike the old atomic RegisterFlatOwnerCommand
 * flow, the Resident/Household/Documents are already persisted by this point — this step only
 * finalizes the actual ownership grant, the one truly business-meaningful commitment. */
export function OwnerReviewSubmitStep({ form, residentId, isEditMode, onBack, onRegistered }: OwnerReviewSubmitStepProps) {
  const [createOwnership, { isLoading }] = useCreateFlatOwnership();
  const { data: members } = useOwnerHouseholdMembers({ id: residentId });
  const [error, setError] = useState<string | null>(null);
  const values = form.getValues();
  const activeMembers = members?.filter((m) => m.isActive) ?? [];

  async function handleSubmit() {
    if (isEditMode) {
      onRegistered();
      return;
    }
    setError(null);
    try {
      await createOwnership({
        createFlatOwnershipCommand: {
          residentId,
          flatId: values.flatId,
          startDate: values.startDate,
        },
      }).unwrap();
      onRegistered();
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

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ReviewField label="Building / Flat">
          <PropertyPreview buildingId={values.buildingId} flatId={values.flatId} />
        </ReviewField>
        <ReviewField label="Ownership since">{formatDate(values.startDate)}</ReviewField>
        <ReviewField label="Owner name">{values.fullName}</ReviewField>
        <ReviewField label="Phone">{values.phone || '—'}</ReviewField>
        <ReviewField label="Email">{values.email || '—'}</ReviewField>
        <ReviewField label="National ID">{values.nationalIdNumber || '—'}</ReviewField>
        <ReviewField label="Passport">{values.passportNumber || '—'}</ReviewField>
        <ReviewField label="Gender">{values.gender || '—'}</ReviewField>
        <ReviewField label="Date of birth">{formatDate(values.dateOfBirth)}</ReviewField>
        <ReviewField label="Blood group">{values.bloodGroup || '—'}</ReviewField>
        <ReviewField label="Religion">{values.religion || '—'}</ReviewField>
        <ReviewField label="Nationality">{values.nationality || '—'}</ReviewField>
        <ReviewField label="Present address">{values.presentAddress || '—'}</ReviewField>
        <ReviewField label="Permanent address">{values.permanentAddress || '—'}</ReviewField>
        <ReviewField label="Profession">{values.profession || '—'}</ReviewField>
        <ReviewField label="Emergency contact">
          {values.emergencyContactName
            ? `${values.emergencyContactName}${values.emergencyContactPhone ? ` (${values.emergencyContactPhone})` : ''}`
            : '—'}
        </ReviewField>
      </dl>

      <div className="border-t pt-4">
        <h4 className="mb-2 text-sm font-medium">Household</h4>
        {activeMembers.length === 0 ? (
          <p className="text-muted-foreground text-sm">No family members added.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {activeMembers.map((m) => (
              <li key={m.residentHouseholdMemberId}>
                {m.relationshipType} — {m.fullName} ({m.gender}, DOB {formatDate(m.dateOfBirth)})
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isLoading}>
          {isEditMode ? 'Done' : isLoading ? 'Registering…' : 'Register owner'}
        </Button>
      </div>
    </div>
  );
}

function ReviewField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  );
}

function PropertyPreview({ buildingId, flatId }: { buildingId: string; flatId: string }) {
  const { data: building } = useGetApiV1PropertiesBuildingsByIdQuery({ id: buildingId }, { skip: !buildingId });
  const { data: flat } = useGetApiV1PropertiesBuildingsByBuildingIdFlatsAndFlatIdQuery(
    { buildingId, flatId },
    { skip: !buildingId || !flatId },
  );

  if (!building || !flat) return <>—</>;
  return (
    <>
      {building.name} ({building.code}) — Flat {flat.flatNumber}
    </>
  );
}
