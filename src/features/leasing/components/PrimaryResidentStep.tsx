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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';
import { useUpdateTenantRegistrationDraft } from '../api/leasingApi';
import { primaryResidentSchema, type PrimaryResidentSchemaType } from '../schemas/primaryResidentSchema';

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
              <FormItem>
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
                <FormItem>
                  <FormLabel>Mobile number (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 01711000000" {...field} />
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

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="primaryNationalIdNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>National ID / Passport number (optional)</FormLabel>
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
                <FormItem>
                  <FormLabel>Date of birth (optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="primaryPermanentAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Permanent address (optional)</FormLabel>
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
                    <Input {...field} />
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
