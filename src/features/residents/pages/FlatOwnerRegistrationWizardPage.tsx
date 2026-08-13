import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
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
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';
import { OwnerAdditionalInfoStep } from '../components/OwnerAdditionalInfoStep';
import { OwnerContactIdentityStep } from '../components/OwnerContactIdentityStep';
import { OwnerDocumentsStep } from '../components/OwnerDocumentsStep';
import { OwnerReviewSubmitStep } from '../components/OwnerReviewSubmitStep';
import { PropertyOwnershipStep } from '../components/PropertyOwnershipStep';
import { flatOwnerRegistrationSchema, type FlatOwnerRegistrationSchemaType } from '../schemas/flatOwnerRegistrationSchema';

const STEPS = [
  { step: 1, title: 'Property & Ownership' },
  { step: 2, title: 'Contact & Identity' },
  { step: 3, title: 'Additional Info' },
  { step: 4, title: 'Review & Submit' },
  { step: 5, title: 'Documents' },
];

/**
 * Guided Flat Owner Registration wizard. Unlike Tenant Registration, there is no Draft/Submitted
 * approval lifecycle here — ownership registration has no concrete approval requirement (see the task
 * brief's "do not introduce approval workflow without a concrete requirement"), so this wizard holds
 * every step's data in one local form instance and only calls the backend once, atomically, at Review
 * & Submit (RegisterFlatOwnerCommand). Documents move to the last step, after that call, because an
 * attachment needs a real Resident id to record against.
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

  // Step components call this after their own validation passes, so forward moves triggered by
  // "Save & Continue" are always allowed. The Stepper nav's own `disabled` prop below is what stops a
  // user from jumping ahead by clicking a future step directly — steps 1-4 are all local (no backend
  // draft to resume), so skipping ahead would show fields that were never validated.
  function goToStep(step: number) {
    setActiveStep(step);
  }

  return (
    <>
      <PageHeader
        title="Flat Owner Registration"
        crumbs={[{ label: 'Resident Management' }, { label: 'Flat Owners', path: '/residents/flat-owners' }, { label: 'New' }]}
      />
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Flat Owner Registration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Stepper value={activeStep} onValueChange={goToStep}>
            <StepperNav className="mb-6">
              {STEPS.map(({ step, title }, index) => (
                <StepperItem key={step} step={step} disabled={step > activeStep && !(step === 5 && residentId)}>
                  <StepperTrigger>
                    <StepperIndicator>{step}</StepperIndicator>
                    <StepperTitle className="hidden sm:block">{title}</StepperTitle>
                  </StepperTrigger>
                  {index < STEPS.length - 1 && <StepperSeparator />}
                </StepperItem>
              ))}
            </StepperNav>
          </Stepper>

          <Form {...form}>
            {activeStep === 1 && <PropertyOwnershipStep form={form} onNext={() => goToStep(2)} />}
            {activeStep === 2 && (
              <OwnerContactIdentityStep form={form} onNext={() => goToStep(3)} onBack={() => goToStep(1)} />
            )}
            {activeStep === 3 && (
              <OwnerAdditionalInfoStep form={form} onNext={() => goToStep(4)} onBack={() => goToStep(2)} />
            )}
            {activeStep === 4 && (
              <OwnerReviewSubmitStep
                form={form}
                onBack={() => goToStep(3)}
                onRegistered={(id) => {
                  setResidentId(id);
                  setActiveStep(5);
                }}
              />
            )}
          </Form>

          {activeStep === 5 && residentId && (
            <OwnerDocumentsStep residentId={residentId} onFinish={() => navigate('/residents/flat-owners')} />
          )}
        </CardContent>
      </Card>
    </>
  );
}
