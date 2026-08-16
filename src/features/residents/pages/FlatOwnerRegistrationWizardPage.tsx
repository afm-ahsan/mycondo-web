import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
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
import { useFlatOwnershipsForOwner, useResident } from '../api/residentsApi';
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
 *
 * Edit mode (`/residents/flat-owners/:residentId/edit`) reuses this same wizard for an owner who has
 * already completed all 5 steps and already holds an active FlatOwnership — unlike Tenant
 * Registration's edit, which just resumes an unfinished draft. So Step 1 (which flat this ownership is
 * for) is read-only here — changing it would be an ownership transfer, a different operation this
 * doesn't support — and Step 5 doesn't re-grant FlatOwnership (it already exists; that would just
 * 409). Only Step 2 actually mutates existing data, via UpdateFlatOwnerProfileCommand instead of the
 * create-mode find-or-create SaveOwnerResidentProfileCommand.
 */
export function FlatOwnerRegistrationWizardPage() {
  const { residentId: routeResidentId } = useParams<{ residentId: string }>();
  const isEditMode = !!routeResidentId;
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [residentId, setResidentId] = useState<string | null>(routeResidentId ?? null);

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

  const { data: existingResident } = useResident(routeResidentId ? { id: routeResidentId } : skipToken);
  const { data: existingOwnerships } = useFlatOwnershipsForOwner(
    routeResidentId ? { residentId: routeResidentId } : skipToken,
  );
  const activeOwnership = existingOwnerships?.find((o) => o.status === 'Active') ?? existingOwnerships?.[0];

  useEffect(() => {
    if (!existingResident || !activeOwnership) return;
    form.reset({
      buildingId: activeOwnership.buildingId,
      flatId: activeOwnership.flatId,
      startDate: activeOwnership.startDate,
      fullName: existingResident.fullName,
      phone: existingResident.phone ?? '',
      alternatePhone: existingResident.alternatePhone ?? '',
      email: existingResident.email ?? '',
      // National ID / passport are masked on read and can never be round-tripped back into this form
      // — leaving these blank on submit preserves the existing value server-side (same convention as
      // OwnerHouseholdStep's household-member National ID field).
      nationalIdNumber: '',
      passportNumber: '',
      dateOfBirth: existingResident.dateOfBirth ?? '',
      gender: existingResident.gender ?? '',
      presentAddress: existingResident.presentAddress ?? '',
      permanentAddress: existingResident.permanentAddress ?? '',
      bloodGroup: existingResident.bloodGroup ?? '',
      religion: existingResident.religion ?? '',
      nationality: existingResident.nationality ?? '',
      fatherName: existingResident.fatherName ?? '',
      motherName: existingResident.motherName ?? '',
      maritalStatus: existingResident.maritalStatus ?? '',
      profession: existingResident.profession ?? '',
      employer: existingResident.employer ?? '',
      officeAddress: existingResident.officeAddress ?? '',
      emergencyContactName: existingResident.emergencyContactName ?? '',
      emergencyContactPhone: existingResident.emergencyContactPhone ?? '',
    });
  }, [existingResident, activeOwnership, form]);

  useUnsavedChangesGuard(form.formState.isDirty && !residentId);

  // Step components call this after their own validation/save passes, so forward moves are always
  // allowed. The Stepper nav's own `disabled` prop below is what stops a user from jumping ahead by
  // clicking a future step directly — steps 3-5 all need a real Resident id (created in Step 2, or
  // already known up front in edit mode).
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
          { label: isEditMode ? 'Edit' : 'New' },
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
              <PropertyOwnershipStep form={form} onNext={() => goToStep(2)} readOnly={isEditMode} />
            )}
            {activeStep === 2 && (
              <OwnerContactIdentityStep
                form={form}
                residentId={residentId ?? undefined}
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
              isEditMode={isEditMode}
              onBack={() => goToStep(4)}
              onRegistered={() => navigate('/residents/flat-owners')}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}
