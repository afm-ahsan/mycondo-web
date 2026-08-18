import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { toApiError } from '@/lib/forms/applyApiErrorToForm';
import { formatDate } from '@/lib/helpers';
import { useHouseholdMembers, useSubmitTenantRegistration, useTenantRegistration } from '../api/leasingApi';
import { tenantRegistrationStatusToneMap, type TenantRegistrationStatus } from '../lib/status';

interface ReviewSubmitStepProps {
  registrationId: string;
  onBack: () => void;
}

/** Step 5 — read-only summary of everything captured so far, then Submit hands the registration to
 * the flat owner for review (Draft/CorrectionsRequested → Submitted). */
export function ReviewSubmitStep({ registrationId, onBack }: ReviewSubmitStepProps) {
  const navigate = useNavigate();
  const { data: registration } = useTenantRegistration({ id: registrationId });
  const { data: members } = useHouseholdMembers({ id: registrationId });
  const [submit, { isLoading }] = useSubmitTenantRegistration();
  const [error, setError] = useState<string | null>(null);

  const activeMembers = members?.filter((m) => m.isActive) ?? [];

  async function handleSubmit() {
    setError(null);
    try {
      await submit({ id: registrationId }).unwrap();
      toast.success('Registration submitted for owner review.');
      navigate(`/leasing/tenant-registrations/${registrationId}`);
    } catch (err) {
      setError(toUserMessage(toApiError(err) ?? err));
    }
  }

  if (!registration) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }

  const isSubmittable = registration.status === 'Draft' || registration.status === 'CorrectionsRequested';

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

      <dl className="grid gap-3 sm:grid-cols-2">
        <ReviewField label="Status">
          <StatusBadge status={registration.status as TenantRegistrationStatus} toneMap={tenantRegistrationStatusToneMap} />
        </ReviewField>
        <ReviewField label="Occupancy type">{registration.occupancyType}</ReviewField>
        <ReviewField label="Primary occupant">{registration.primaryFullName}</ReviewField>
        <ReviewField label="Phone">{registration.primaryPhone ?? '—'}</ReviewField>
        <ReviewField label="Email">{registration.primaryEmail ?? '—'}</ReviewField>
        <ReviewField label="National ID">{registration.primaryNationalIdNumberMasked ?? '—'}</ReviewField>
        <ReviewField label="Gender">{registration.primaryGender ?? '—'}</ReviewField>
        <ReviewField label="Date of birth">{formatDate(registration.primaryDateOfBirth)}</ReviewField>
        <ReviewField label="Blood group">{registration.primaryBloodGroup ?? '—'}</ReviewField>
        <ReviewField label="Religion">{registration.primaryReligion ?? '—'}</ReviewField>
        <ReviewField label="Nationality">{registration.primaryNationality ?? '—'}</ReviewField>
        <ReviewField label="Profession">{registration.primaryProfession ?? '—'}</ReviewField>
        <ReviewField label="Permanent address">{registration.primaryPermanentAddress ?? '—'}</ReviewField>
        <ReviewField label="Emergency contact">
          {registration.emergencyContactName
            ? `${registration.emergencyContactName}${registration.emergencyContactPhone ? ` (${registration.emergencyContactPhone})` : ''}`
            : '—'}
        </ReviewField>
        <ReviewField label="Expected move-in">{formatDate(registration.moveInExpectedDate)}</ReviewField>
      </dl>

      <div className="border-t pt-4">
        <h4 className="mb-2 text-sm font-medium">Household</h4>
        {activeMembers.length === 0 ? (
          <p className="text-muted-foreground text-sm">No household members added.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {activeMembers.map((m) => (
              <li key={m.householdMemberId}>
                {m.relationshipToPrimary} — {m.fullName}
                {m.gender ? ` (${m.gender}${m.dateOfBirth ? `, DOB ${formatDate(m.dateOfBirth)}` : ''})` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isLoading || !isSubmittable}>
          {isLoading ? 'Submitting…' : isSubmittable ? 'Submit for owner review' : `Already ${registration.status}`}
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
