import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toUserMessage } from '@/api/errors';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BangladeshPhoneInput } from '@/components/shared/BangladeshPhoneInput';
import { BloodGroupSelect } from '@/components/shared/BloodGroupSelect';
import { DateOfBirthWithAge } from '@/components/shared/DateOfBirthWithAge';
import { GenderSelect } from '@/components/shared/GenderSelect';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';
import { useUpdateTenantRegistrationDraft } from '../api/leasingApi';
import { primaryResidentSchema, type PrimaryResidentSchemaType } from '../schemas/primaryResidentSchema';

const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed'] as const;

interface PrimaryResidentStepProps {
  registrationId: string;
  primaryFullName: string;
  moveInExpectedDate: string | null;
  defaultValues: Partial<PrimaryResidentSchemaType>;
  onSaved: (values: PrimaryResidentSchemaType) => void;
  onBack: () => void;
}

/** Step 2 — contact and identity details for the primary occupant. National ID and date of birth
 * are sensitive fields (see mycondo-api's IdentityMasking) — collected here, but read back masked
 * everywhere after this point, matching the rest of the app's masking discipline. */
export function PrimaryResidentStep({
  registrationId,
  primaryFullName,
  moveInExpectedDate,
  defaultValues,
  onSaved,
  onBack,
}: PrimaryResidentStepProps) {
  const [updateDraft, { isLoading }] = useUpdateTenantRegistrationDraft();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<PrimaryResidentSchemaType>({
    resolver: zodResolver(primaryResidentSchema),
    defaultValues: {
      primaryFullName,
      primaryPhone: defaultValues.primaryPhone ?? '',
      primaryEmail: defaultValues.primaryEmail ?? '',
      primaryNationalIdNumber: defaultValues.primaryNationalIdNumber ?? '',
      primaryDateOfBirth: defaultValues.primaryDateOfBirth ?? '',
      primaryGender: defaultValues.primaryGender ?? '',
      primaryBloodGroup: defaultValues.primaryBloodGroup ?? '',
      primaryReligion: defaultValues.primaryReligion ?? '',
      primaryNationality: defaultValues.primaryNationality ?? '',
      primaryFatherName: defaultValues.primaryFatherName ?? '',
      primaryMotherName: defaultValues.primaryMotherName ?? '',
      primaryMaritalStatus: defaultValues.primaryMaritalStatus ?? '',
      primaryProfession: defaultValues.primaryProfession ?? '',
      primaryPermanentAddress: defaultValues.primaryPermanentAddress ?? '',
      emergencyContactName: defaultValues.emergencyContactName ?? '',
      emergencyContactPhone: defaultValues.emergencyContactPhone ?? '',
    },
  });

  useUnsavedChangesGuard(form.formState.isDirty);

  async function onSubmit(values: PrimaryResidentSchemaType) {
    setError(null);

    try {
      await updateDraft({
        id: registrationId,
        updateOccupancyRegistrationDraftRequest: {
          primaryFullName: values.primaryFullName,
          primaryPhone: values.primaryPhone || null,
          primaryEmail: values.primaryEmail || null,
          primaryNationalIdNumber: values.primaryNationalIdNumber || null,
          primaryDateOfBirth: values.primaryDateOfBirth || null,
          primaryGender: values.primaryGender || null,
          primaryBloodGroup: values.primaryBloodGroup || null,
          primaryReligion: values.primaryReligion || null,
          primaryNationality: values.primaryNationality || null,
          primaryFatherName: values.primaryFatherName || null,
          primaryMotherName: values.primaryMotherName || null,
          primaryMaritalStatus: values.primaryMaritalStatus || null,
          primaryProfession: values.primaryProfession || null,
          primaryPermanentAddress: values.primaryPermanentAddress || null,
          emergencyContactName: values.emergencyContactName || null,
          emergencyContactPhone: values.emergencyContactPhone || null,
          moveInExpectedDate,
        },
      }).unwrap();
      onSaved(values);
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError);
      if (!handled) {
        setError(toUserMessage(apiError ?? err));
      }
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="primaryFullName"
            render={({ field }) => (
              <FormItem required>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="primaryPhone"
              render={({ field }) => (
                <FormItem required>
                  <FormLabel>Mobile number</FormLabel>
                  <FormControl>
                    <BangladeshPhoneInput {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="primaryEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (optional)</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="primaryNationalIdNumber"
              render={({ field }) => (
                <FormItem required>
                  <FormLabel>National ID / Passport number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="primaryDateOfBirth"
              render={({ field }) => (
                <FormItem required>
                  <FormLabel>Date of birth</FormLabel>
                  <FormControl>
                    <DateOfBirthWithAge {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="primaryGender"
              render={({ field }) => (
                <FormItem required>
                  <FormLabel>Gender</FormLabel>
                  <GenderSelect value={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="primaryBloodGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Blood group (optional)</FormLabel>
                  <BloodGroupSelect value={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="primaryReligion"
              render={({ field }) => (
                <FormItem required>
                  <FormLabel>Religion</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="primaryNationality"
              render={({ field }) => (
                <FormItem required>
                  <FormLabel>Nationality</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="primaryFatherName"
              render={({ field }) => (
                <FormItem required>
                  <FormLabel>Father&apos;s name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="primaryMotherName"
              render={({ field }) => (
                <FormItem required>
                  <FormLabel>Mother&apos;s name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="primaryMaritalStatus"
              render={({ field }) => (
                <FormItem required>
                  <FormLabel>Marital status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MARITAL_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="primaryProfession"
            render={({ field }) => (
              <FormItem required>
                <FormLabel>Profession</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="primaryPermanentAddress"
            render={({ field }) => (
              <FormItem required>
                <FormLabel>Permanent address</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="emergencyContactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency contact name (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emergencyContactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency contact phone (optional)</FormLabel>
                  <FormControl>
                    <BangladeshPhoneInput {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving…' : 'Save & Continue'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
