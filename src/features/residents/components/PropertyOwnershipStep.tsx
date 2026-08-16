import type { UseFormReturn } from 'react-hook-form';
import {
  useGetApiV1PropertiesBuildingsByBuildingIdFlatsAndFlatIdQuery,
  useGetApiV1PropertiesBuildingsByIdQuery,
} from '@/api/generated/mycondoApi';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { FlatSelect } from '@/components/shared/FlatSelect';
import type { FlatOwnerRegistrationSchemaType } from '../schemas/flatOwnerRegistrationSchema';

interface PropertyOwnershipStepProps {
  form: UseFormReturn<FlatOwnerRegistrationSchemaType>;
  onNext: () => void;
  /** Edit mode: the flat this ownership applies to is fixed — changing it would be an ownership
   * transfer, a different operation this wizard doesn't support — so this step becomes a read-only
   * summary instead of an editable form. */
  readOnly?: boolean;
}

/** Step 1 — the ownership relationship: which Building/Flat, and since when. Shares the wizard's
 * single form instance (wrapped once in `FlatOwnerRegistrationWizardPage`) rather than owning its own. */
export function PropertyOwnershipStep({ form, onNext, readOnly }: PropertyOwnershipStepProps) {
  const buildingId = form.watch('buildingId');
  const flatId = form.watch('flatId');
  const startDate = form.watch('startDate');

  const { data: building } = useGetApiV1PropertiesBuildingsByIdQuery({ id: buildingId }, { skip: !readOnly || !buildingId });
  const { data: flat } = useGetApiV1PropertiesBuildingsByBuildingIdFlatsAndFlatIdQuery(
    { buildingId, flatId },
    { skip: !readOnly || !buildingId || !flatId },
  );

  async function handleNext() {
    if (readOnly) {
      onNext();
      return;
    }
    const valid = await form.trigger(['buildingId', 'flatId', 'startDate']);
    if (valid) onNext();
  }

  if (readOnly) {
    return (
      <div className="space-y-4">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-muted-foreground text-xs">Building / Flat</dt>
            <dd className="text-sm font-medium">
              {building && flat ? `${building.name} (${building.code}) — Flat ${flat.flatNumber}` : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Ownership effective date</dt>
            <dd className="text-sm font-medium">{startDate}</dd>
          </div>
        </dl>
        <div className="flex gap-2 border-t pt-4">
          <Button type="button" onClick={handleNext}>
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue('flatId', '');
                  }}
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
              <FormLabel>Flat</FormLabel>
              <FormControl>
                <FlatSelect buildingId={buildingId} value={field.value} onValueChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ownership effective date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex gap-2 border-t pt-4">
        <Button type="button" onClick={handleNext}>
          Save &amp; Continue
        </Button>
      </div>
    </div>
  );
}
