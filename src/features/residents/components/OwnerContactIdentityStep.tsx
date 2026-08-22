import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';
import { toUserMessage } from '@/api/errors';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BangladeshPhoneInput } from '@/components/shared/BangladeshPhoneInput';
import { BloodGroupSelect } from '@/components/shared/BloodGroupSelect';
import { DateOfBirthWithAge } from '@/components/shared/DateOfBirthWithAge';
import { GenderSelect } from '@/components/shared/GenderSelect';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { useSaveOwnerResidentProfile, useUpdateFlatOwnerProfile } from '../api/residentsApi';
import {
  OWNER_CONTACT_IDENTITY_FIELDS,
  type FlatOwnerRegistrationSchemaType,
} from '../schemas/flatOwnerRegistrationSchema';

const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed'] as const;

interface OwnerContactIdentityStepProps {
  form: UseFormReturn<FlatOwnerRegistrationSchemaType>;
  /** Present in edit mode — the Resident already exists, so "Save & Continue" updates it
   * (UpdateFlatOwnerProfileCommand) instead of the create-mode find-or-create. */
  residentId?: string;
  /** Edit mode only — whether this Resident already has a National ID on file (derived from
   * `nationalIdNumberMasked` being non-null). National ID is masked on read and never round-tripped
   * back into this form, so leaving it blank only means "keep existing" when one already exists;
   * otherwise it must be supplied now, same as create mode. */
  hasExistingNationalId?: boolean;
  onSaved: (residentId: string) => void;
  onBack: () => void;
}

/** Step 2 — contact, identity, and family/professional details. National ID/passport are sensitive
 * fields — collected here, but read back masked everywhere after this point (mycondo-api's
 * IdentityMasking). In create mode, "Save & Continue" persists the shared Resident record
 * (SaveOwnerResidentProfile) without granting FlatOwnership yet, so Household and Documents can attach
 * to a real Resident id before Review & Submit finalizes the ownership grant. In edit mode it updates
 * the existing Resident by id instead (UpdateFlatOwnerProfile) — National ID/passport are left blank
 * and skipped from validation, matching OwnerHouseholdStep's "leave blank to keep existing" masked-field
 * convention. */
export function OwnerContactIdentityStep({
  form,
  residentId,
  hasExistingNationalId,
  onSaved,
  onBack,
}: OwnerContactIdentityStepProps) {
  const [saveProfile, { isLoading: isSaving }] = useSaveOwnerResidentProfile();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateFlatOwnerProfile();
  const isLoading = isSaving || isUpdating;
  const [error, setError] = useState<string | null>(null);
  const nationalIdRequired = !residentId || !hasExistingNationalId;
  const fieldsToValidate = nationalIdRequired
    ? OWNER_CONTACT_IDENTITY_FIELDS
    : OWNER_CONTACT_IDENTITY_FIELDS.filter((field) => field !== 'nationalIdNumber');

  async function handleNext() {
    setError(null);
    const valid = await form.trigger(fieldsToValidate);
    if (!valid) return;

    const values = form.getValues();
    try {
      if (residentId) {
        await updateProfile({
          residentId,
          updateFlatOwnerProfileRequest: {
            fullName: values.fullName,
            phone: values.phone || null,
            email: values.email || null,
            alternatePhone: values.alternatePhone || null,
            nationalIdNumber: values.nationalIdNumber || null,
            passportNumber: values.passportNumber || null,
            dateOfBirth: values.dateOfBirth,
            gender: values.gender,
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
            bloodGroup: values.bloodGroup || null,
            religion: values.religion || null,
            nationality: values.nationality || null,
          },
        }).unwrap();
        onSaved(residentId);
        return;
      }

      const result = await saveProfile({
        saveOwnerResidentProfileCommand: {
          flatId: values.flatId,
          fullName: values.fullName,
          phone: values.phone || null,
          email: values.email || null,
          alternatePhone: values.alternatePhone || null,
          nationalIdNumber: values.nationalIdNumber,
          passportNumber: values.passportNumber || null,
          dateOfBirth: values.dateOfBirth,
          gender: values.gender,
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
          bloodGroup: values.bloodGroup || null,
          religion: values.religion || null,
          nationality: values.nationality || null,
        },
      }).unwrap();
      onSaved(result.residentId);
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

      <FormField
        control={form.control}
        name="fullName"
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FormField
          control={form.control}
          name="phone"
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
          name="alternatePhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alternate mobile (optional)</FormLabel>
              <FormControl>
                <BangladeshPhoneInput {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
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
          name="nationalIdNumber"
          render={({ field }) => (
            <FormItem required={nationalIdRequired}>
              <FormLabel>National ID{!nationalIdRequired ? ' (optional)' : ''}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={!nationalIdRequired ? 'Leave blank to keep existing' : undefined} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="passportNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Passport number (optional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gender"
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
          name="dateOfBirth"
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
          name="bloodGroup"
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
          name="nationality"
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

      <FormField
        control={form.control}
        name="religion"
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
        name="presentAddress"
        render={({ field }) => (
          <FormItem required>
            <FormLabel>Present address</FormLabel>
            <FormControl>
              <Textarea rows={3} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="permanentAddress"
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

      <div className="grid gap-4 border-t pt-4 sm:grid-cols-2 lg:grid-cols-3">
        <FormField
          control={form.control}
          name="fatherName"
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
          name="motherName"
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
          name="maritalStatus"
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FormField
          control={form.control}
          name="profession"
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
          name="employer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employer / organization (optional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="officeAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Office address (optional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

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

      <div className="flex gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <Button type="button" onClick={handleNext} disabled={isLoading}>
          {isLoading ? 'Saving…' : 'Save & Continue'}
        </Button>
      </div>
    </div>
  );
}
