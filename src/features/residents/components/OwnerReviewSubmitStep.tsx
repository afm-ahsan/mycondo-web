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
import { useRegisterFlatOwner } from '../api/residentsApi';
import type { FlatOwnerRegistrationSchemaType } from '../schemas/flatOwnerRegistrationSchema';

interface OwnerReviewSubmitStepProps {
  form: UseFormReturn<FlatOwnerRegistrationSchemaType>;
  onBack: () => void;
  onRegistered: (residentId: string) => void;
}

/** Step 4 — read-only summary, then Submit performs the single atomic RegisterFlatOwnerCommand call
 * that creates the Resident and grants the first FlatOwnership. There is no draft/approval lifecycle
 * to advance here, unlike Tenant Registration — this step both finalizes and creates the record. */
export function OwnerReviewSubmitStep({ form, onBack, onRegistered }: OwnerReviewSubmitStepProps) {
  const [register, { isLoading }] = useRegisterFlatOwner();
  const [error, setError] = useState<string | null>(null);
  const values = form.getValues();

  async function handleSubmit() {
    setError(null);
    try {
      const result = await register({
        registerFlatOwnerCommand: {
          flatId: values.flatId,
          startDate: values.startDate,
          fullName: values.fullName,
          phone: values.phone || null,
          email: values.email || null,
          alternatePhone: values.alternatePhone || null,
          nationalIdNumber: values.nationalIdNumber || null,
          passportNumber: values.passportNumber || null,
          dateOfBirth: values.dateOfBirth || null,
          gender: values.gender || null,
          presentAddress: values.presentAddress || null,
          permanentAddress: values.permanentAddress || null,
          fatherName: values.fatherName || null,
          motherName: values.motherName || null,
          maritalStatus: values.maritalStatus || null,
          profession: values.profession || null,
          employer: values.employer || null,
          officeAddress: values.officeAddress || null,
          emergencyContactName: values.emergencyContactName || null,
          emergencyContactPhone: values.emergencyContactPhone || null,
        },
      }).unwrap();
      onRegistered(result.residentId);
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
        <ReviewField label="Ownership since">{values.startDate}</ReviewField>
        <ReviewField label="Owner name">{values.fullName}</ReviewField>
        <ReviewField label="Phone">{values.phone || '—'}</ReviewField>
        <ReviewField label="Email">{values.email || '—'}</ReviewField>
        <ReviewField label="National ID">{values.nationalIdNumber || '—'}</ReviewField>
        <ReviewField label="Passport">{values.passportNumber || '—'}</ReviewField>
        <ReviewField label="Date of birth">{values.dateOfBirth || '—'}</ReviewField>
        <ReviewField label="Present address">{values.presentAddress || '—'}</ReviewField>
        <ReviewField label="Permanent address">{values.permanentAddress || '—'}</ReviewField>
        <ReviewField label="Profession">{values.profession || '—'}</ReviewField>
        <ReviewField label="Emergency contact">
          {values.emergencyContactName
            ? `${values.emergencyContactName}${values.emergencyContactPhone ? ` (${values.emergencyContactPhone})` : ''}`
            : '—'}
        </ReviewField>
      </dl>

      <div className="flex gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Registering…' : 'Register owner'}
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
