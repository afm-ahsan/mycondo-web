import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
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
import { OwnerContactIdentityStep } from '../components/OwnerContactIdentityStep';
import { OwnerDocumentsStep } from '../components/OwnerDocumentsStep';
import { OwnerHouseholdStep } from '../components/OwnerHouseholdStep';
import { OwnerReviewSubmitStep } from '../components/OwnerReviewSubmitStep';
import { PropertyOwnershipStep } from '../components/PropertyOwnershipStep';
import {
  flatOwnerRegistrationSchema,
  type FlatOwnerRegistrationSchemaType,
} from '../schemas/flatOwnerRegistrationSchema';

const STEPS = [
  { step: 1, title: 'Property & Ownership' },
  { step: 2, title: 'Contact & Identity' },
  { step: 3, title: 'Household' },
  { step: 4, title: 'Documents' },
  { step: 5, title: 'Review & Submit' },
];

/**
 * Guided Flat Owner Registration wizard, matching Tenant Registration's 5-step shape: Property &
 * Ownership / Contact & Identity / Household / Documents / Review & Submit. Unlike Tenant
 * Registration, there is still no Draft/Submitted approval lifecycle — ownership registration has no
 * concrete approval requirement — but Steps 2 onward now persist incrementally: Step 2's "Save &
 * Continue" creates/updates the shared Resident (SaveOwnerResidentProfileCommand) without granting
 * FlatOwnership yet, which is what lets Household (Step 3) and Documents (Step 4) attach to a real
 * Resident id before Review & Submit (Step 5) grants the actual FlatOwnership
 * (CreateFlatOwnershipCommand) — the one truly atomic, business-meaningful commitment.
 */
export function FlatOwnerRegistrationWizardPage() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [residentId, setResidentId] = useState<string | null>(null);

  const form = useForm<FlatOwnerRegistrationSchemaType>({
    resolver: zodResolver(flatOwnerRegistrationSchema),
    defaultValues: {
      buildingId: '',
      flatId: '',
      startDate: new Date().toISOString().slice(0, 10),
      fullName: '',
      phone: '',
      alternatePhone: '',
      email: '',
      nationalIdNumber: '',
      passportNumber: '',
      dateOfBirth: '',
      gender: '',
      presentAddress: '',
      permanentAddress: '',
      bloodGroup: '',
      religion: '',
      nationality: '',
      fatherName: '',
      motherName: '',
      maritalStatus: '',
      profession: '',
      employer: '',
      officeAddress: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
    },
  });

  useUnsavedChangesGuard(form.formState.isDirty && !residentId);

  // Step components call this after their own validation/save passes, so forward moves are always
  // allowed. The Stepper nav's own `disabled` prop below is what stops a user from jumping ahead by
  // clicking a future step directly — steps 3-5 all need a real Resident id (created in Step 2).
  function goToStep(step: number) {
    setActiveStep(step);
  }

  return (
    <>
      <PageHeader
        title="Flat Owner Registration"
        crumbs={[
          { label: 'Resident Management' },
          { label: 'Flat Owners', path: '/residents/flat-owners' },
          { label: 'New' },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle>Flat Owner Registration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Stepper value={activeStep} onValueChange={goToStep}>
            <StepperNav className="mb-6">
              {STEPS.map(({ step, title }, index) => (
                <StepperItem
                  key={step}
                  step={step}
                  disabled={step > activeStep && !(step >= 3 && residentId)}
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

          <Form {...form}>
            {activeStep === 1 && (
              <PropertyOwnershipStep form={form} onNext={() => goToStep(2)} />
            )}
            {activeStep === 2 && (
              <OwnerContactIdentityStep
                form={form}
                onSaved={(id) => {
                  setResidentId(id);
                  goToStep(3);
                }}
                onBack={() => goToStep(1)}
              />
            )}
          </Form>

          {activeStep === 3 && residentId && (
            <OwnerHouseholdStep
              residentId={residentId}
              onContinue={() => goToStep(4)}
              onBack={() => goToStep(2)}
            />
          )}

          {activeStep === 4 && residentId && (
            <OwnerDocumentsStep residentId={residentId} onFinish={() => goToStep(5)} />
          )}

          {activeStep === 5 && residentId && (
            <OwnerReviewSubmitStep
              form={form}
              residentId={residentId}
              onBack={() => goToStep(4)}
              onRegistered={() => navigate('/residents/flat-owners')}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}
