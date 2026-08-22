import { useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@/components/ui/stepper';
import { PageHeader } from '@/components/shared/PageHeader';
import { useTenantRegistration } from '../api/leasingApi';
import { DocumentsStep } from '../components/DocumentsStep';
import { HouseholdMembersStep } from '../components/HouseholdMembersStep';
import { OccupancyDetailsStep } from '../components/OccupancyDetailsStep';
import { PrimaryResidentStep } from '../components/PrimaryResidentStep';
import { ReviewSubmitStep } from '../components/ReviewSubmitStep';
import type { OccupancyDetailsSchemaType } from '../schemas/occupancyDetailsSchema';

const STEPS = [
  { step: 1, title: 'Property & Occupant' },
  { step: 2, title: 'Contact & Identity' },
  { step: 3, title: 'Household' },
  { step: 4, title: 'Documents' },
  { step: 5, title: 'Review & Submit' },
];

/**
 * Guided multi-step Tenant Registration wizard — replaces the paper Flat Owner/Tenant Registration
 * Form with a structured flow instead of one large replica screen. A draft is created after Step 1
 * and the URL updates to `/leasing/tenant-registrations/:id/edit`, so revisiting that link resumes
 * exactly where the applicant left off (no separate "Save Draft" action needed — every step already
 * persists to the backend as it's completed).
 */
export function TenantRegistrationWizardPage() {
  const { id: routeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [registrationId, setRegistrationId] = useState<string | undefined>(
    routeId,
  );
  const [activeStep, setActiveStep] = useState(routeId ? 2 : 1);
  const [primaryFullName, setPrimaryFullName] = useState('');

  const { data: registration } = useTenantRegistration(
    registrationId ? { id: registrationId } : skipToken,
  );

  function goToStep(step: number) {
    // Only allow jumping to an already-reached step or the very next one — a resumed draft that
    // hasn't been submitted yet, jumping ahead of an unfinished step would let the wizard show
    // stale/undefined data for a step whose prerequisites were never saved.
    setActiveStep(step);
  }

  function handleOccupancyDetailsSaved(
    id: string,
    values: OccupancyDetailsSchemaType,
  ) {
    setPrimaryFullName(values.primaryFullName);
    if (!registrationId) {
      setRegistrationId(id);
      navigate(`/leasing/tenant-registrations/${id}/edit`, { replace: true });
    }
    goToStep(2);
  }

  return (
    <>
      <PageHeader
        title="Tenant Registration"
        crumbs={[
          {
            label: 'Tenant Registrations',
            path: '/leasing/tenant-registrations',
          },
          { label: registrationId ? 'Edit' : 'New' },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle>Tenant Registration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Stepper value={activeStep} onValueChange={goToStep}>
            <StepperNav className="mb-6">
              {STEPS.map(({ step, title }, index) => (
                <StepperItem
                  key={step}
                  step={step}
                  disabled={step > activeStep && !registrationId}
                >
                  <StepperTrigger>
                    <StepperIndicator>{step}</StepperIndicator>
                    <StepperTitle className="hidden sm:block">
                      {title}
                    </StepperTitle>
                  </StepperTrigger>
                  {index < STEPS.length - 1 && <StepperSeparator />}
                </StepperItem>
              ))}
            </StepperNav>
          </Stepper>

          {activeStep === 1 && (
            <OccupancyDetailsStep
              registrationId={registrationId}
              existingRegistration={registration}
              defaultValues={{
                flatId: registration?.flatId,
                occupancyType: registration?.occupancyType as
                  | 'Owner'
                  | 'Occupant'
                  | undefined,
                primaryFullName:
                  registration?.primaryFullName ?? primaryFullName,
                moveInExpectedDate:
                  registration?.moveInExpectedDate ?? undefined,
              }}
              onSaved={handleOccupancyDetailsSaved}
            />
          )}

          {activeStep === 2 && registrationId && (
            <PrimaryResidentStep
              registrationId={registrationId}
              primaryFullName={registration?.primaryFullName ?? primaryFullName}
              moveInExpectedDate={registration?.moveInExpectedDate ?? null}
              defaultValues={{
                primaryPhone: registration?.primaryPhone ?? undefined,
                primaryEmail: registration?.primaryEmail ?? undefined,
                primaryNationalIdNumber: undefined,
                primaryDateOfBirth:
                  registration?.primaryDateOfBirth ?? undefined,
                primaryGender: registration?.primaryGender ?? undefined,
                primaryBloodGroup: registration?.primaryBloodGroup ?? undefined,
                primaryReligion: registration?.primaryReligion ?? undefined,
                primaryNationality:
                  registration?.primaryNationality ?? undefined,
                primaryFatherName:
                  registration?.primaryFatherName ?? undefined,
                primaryMotherName:
                  registration?.primaryMotherName ?? undefined,
                primaryMaritalStatus:
                  registration?.primaryMaritalStatus ?? undefined,
                primaryProfession:
                  registration?.primaryProfession ?? undefined,
                primaryPermanentAddress:
                  registration?.primaryPermanentAddress ?? undefined,
                emergencyContactName:
                  registration?.emergencyContactName ?? undefined,
                emergencyContactPhone:
                  registration?.emergencyContactPhone ?? undefined,
              }}
              onSaved={() => goToStep(3)}
              onBack={() => goToStep(1)}
            />
          )}

          {activeStep === 3 && registrationId && (
            <HouseholdMembersStep
              registrationId={registrationId}
              onContinue={() => goToStep(4)}
              onBack={() => goToStep(2)}
            />
          )}

          {activeStep === 4 && registrationId && (
            <DocumentsStep
              registrationId={registrationId}
              onContinue={() => goToStep(5)}
              onBack={() => goToStep(3)}
            />
          )}

          {activeStep === 5 && registrationId && (
            <ReviewSubmitStep
              registrationId={registrationId}
              onBack={() => goToStep(4)}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}
