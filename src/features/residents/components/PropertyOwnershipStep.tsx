import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { FlatSelect } from '@/components/shared/FlatSelect';
import type { FlatOwnerRegistrationSchemaType } from '../schemas/flatOwnerRegistrationSchema';

interface PropertyOwnershipStepProps {
  form: UseFormReturn<FlatOwnerRegistrationSchemaType>;
  onNext: () => void;
}

/** Step 1 — the ownership relationship: which Building/Flat, and since when. Shares the wizard's
 * single form instance (wrapped once in `FlatOwnerRegistrationWizardPage`) rather than owning its own. */
export function PropertyOwnershipStep({ form, onNext }: PropertyOwnershipStepProps) {
  const buildingId = form.watch('buildingId');

  async function handleNext() {
    const valid = await form.trigger(['buildingId', 'flatId', 'startDate']);
    if (valid) onNext();
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
