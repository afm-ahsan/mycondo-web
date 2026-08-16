import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';
import { toUserMessage } from '@/api/errors';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BangladeshPhoneInput } from '@/components/shared/BangladeshPhoneInput';
import { BloodGroupSelect } from '@/components/shared/BloodGroupSelect';
import { DateOfBirthWithAge } from '@/components/shared/DateOfBirthWithAge';
import { GenderSelect } from '@/components/shared/GenderSelect';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { useSaveOwnerResidentProfile } from '../api/residentsApi';
import {
  OWNER_CONTACT_IDENTITY_FIELDS,
  type FlatOwnerRegistrationSchemaType,
} from '../schemas/flatOwnerRegistrationSchema';

const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed'] as const;

interface OwnerContactIdentityStepProps {
  form: UseFormReturn<FlatOwnerRegistrationSchemaType>;
  onSaved: (residentId: string) => void;
  onBack: () => void;
}

/** Step 2 — contact, identity, and family/professional details. National ID/passport are sensitive
 * fields — collected here, but read back masked everywhere after this point (mycondo-api's
 * IdentityMasking). "Save & Continue" persists the shared Resident record (SaveOwnerResidentProfile)
 * without granting FlatOwnership yet, so Household and Documents can attach to a real Resident id
 * before Review & Submit finalizes the ownership grant. */
export function OwnerContactIdentityStep({ form, onSaved, onBack }: OwnerContactIdentityStepProps) {
  const [saveProfile, { isLoading }] = useSaveOwnerResidentProfile();
  const [error, setError] = useState<string | null>(null);

  async function handleNext() {
    setError(null);
    const valid = await form.trigger(OWNER_CONTACT_IDENTITY_FIELDS);
    if (!valid) return;

    const values = form.getValues();
    try {
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
          <FormItem>
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
            <FormItem>
              <FormLabel>Mobile number (optional)</FormLabel>
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
            <FormItem>
              <FormLabel>National ID</FormLabel>
              <FormControl>
                <Input {...field} />
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
            <FormItem>
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
            <FormItem>
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
            <FormItem>
              <FormLabel>Nationality (optional)</FormLabel>
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
          <FormItem>
            <FormLabel>Religion (optional)</FormLabel>
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
          <FormItem>
            <FormLabel>Present address (optional)</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="permanentAddress"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Permanent address (optional)</FormLabel>
            <FormControl>
              <Input {...field} />
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
            <FormItem>
              <FormLabel>Father&apos;s name (optional)</FormLabel>
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
            <FormItem>
              <FormLabel>Mother&apos;s name (optional)</FormLabel>
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
            <FormItem>
              <FormLabel>Marital status (optional)</FormLabel>
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
            <FormItem>
              <FormLabel>Profession (optional)</FormLabel>
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
