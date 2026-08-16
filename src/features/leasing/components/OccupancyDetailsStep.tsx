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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { FlatSelect } from '@/components/shared/FlatSelect';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';
import type { OccupancyRegistrationDto } from '@/api/generated/mycondoApi';
import { useCreateTenantRegistration, useUpdateTenantRegistrationDraft } from '../api/leasingApi';
import {
  occupancyDetailsSchema,
  type OccupancyDetailsSchemaType,
} from '../schemas/occupancyDetailsSchema';

interface OccupancyDetailsStepProps {
  registrationId: string | undefined;
  /** The full fetched registration, if resuming a draft — needed so re-saving Step 1 doesn't
   * overwrite fields captured on Step 2 (UpdateOccupancyRegistrationDraftRequest replaces the whole
   * record, it isn't a partial patch). */
  existingRegistration: OccupancyRegistrationDto | undefined;
  defaultValues: Partial<OccupancyDetailsSchemaType>;
  onSaved: (registrationId: string, values: OccupancyDetailsSchemaType) => void;
}

/** Step 1 — property/unit selection, occupancy type, and the primary occupant's name. Creates the
 * draft registration on first save (person-reuse and one-active-registration-per-flat are enforced
 * server-side); later visits update the same draft in place. */
export function OccupancyDetailsStep({
  registrationId,
  existingRegistration,
  defaultValues,
  onSaved,
}: OccupancyDetailsStepProps) {
  const [createRegistration, { isLoading: isCreating }] = useCreateTenantRegistration();
  const [updateDraft, { isLoading: isUpdating }] = useUpdateTenantRegistrationDraft();
  const [error, setError] = useState<string | null>(null);
  const isLoading = isCreating || isUpdating;

  const form = useForm<OccupancyDetailsSchemaType>({
    resolver: zodResolver(occupancyDetailsSchema),
    defaultValues: {
      buildingId: defaultValues.buildingId ?? '',
      flatId: defaultValues.flatId ?? '',
      occupancyType: defaultValues.occupancyType ?? 'Owner',
      primaryFullName: defaultValues.primaryFullName ?? '',
      moveInExpectedDate: defaultValues.moveInExpectedDate ?? '',
    },
  });

  const buildingId = form.watch('buildingId');

  useUnsavedChangesGuard(form.formState.isDirty);

  async function onSubmit(values: OccupancyDetailsSchemaType) {
    setError(null);

    try {
      if (!registrationId) {
        const created = await createRegistration({
          createOccupancyRegistrationCommand: {
            flatId: values.flatId,
            occupancyType: values.occupancyType,
            primaryFullName: values.primaryFullName,
            primaryPhone: null,
            primaryEmail: null,
            primaryNationalIdNumber: null,
            primaryDateOfBirth: null,
            primaryPermanentAddress: null,
            emergencyContactName: null,
            emergencyContactPhone: null,
            moveInExpectedDate: values.moveInExpectedDate || null,
          },
        }).unwrap();
        onSaved(created.occupancyRegistrationId, values);
      } else {
        await updateDraft({
          id: registrationId,
          updateOccupancyRegistrationDraftRequest: {
            primaryFullName: values.primaryFullName,
            primaryPhone: existingRegistration?.primaryPhone ?? null,
            primaryEmail: existingRegistration?.primaryEmail ?? null,
            // The DTO only ever exposes the masked NID, never the raw value (see IdentityMasking) —
            // there is no way to preserve it from here, so re-saving Step 1 clears it. The applicant
            // must re-enter it on Step 2 if this happens; disclosed, not silently lost.
            primaryNationalIdNumber: null,
            primaryDateOfBirth: existingRegistration?.primaryDateOfBirth ?? null,
            primaryPermanentAddress: existingRegistration?.primaryPermanentAddress ?? null,
            emergencyContactName: existingRegistration?.emergencyContactName ?? null,
            emergencyContactPhone: existingRegistration?.emergencyContactPhone ?? null,
            moveInExpectedDate: values.moveInExpectedDate || null,
          },
        }).unwrap();
        onSaved(registrationId, values);
      }
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="occupancy-details-step">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="buildingId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Building</FormLabel>
                  <FormControl>
                    <BuildingSelect
                      value={field.value}
                      onValueChange={(buildingId) => {
                        field.onChange(buildingId);
                        form.setValue('flatId', '');
                      }}
                      disabled={!!registrationId}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="flatId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Flat / Unit</FormLabel>
                  <FormControl>
                    <FlatSelect
                      buildingId={buildingId}
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!!registrationId}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="occupancyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Occupancy type</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select occupancy type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Owner">Owner-occupant</SelectItem>
                        <SelectItem value="Occupant">Renter / occupant</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="primaryFullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary occupant's full name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Karim Ahmed" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="moveInExpectedDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected move-in date (optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-2 border-t pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving…' : 'Save & Continue'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
