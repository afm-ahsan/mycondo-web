import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { generatorSchema, type GeneratorSchemaType } from '../schemas/generatorSchema';

interface GeneratorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting?: boolean;
  onSubmit: (values: GeneratorSchemaType) => void;
  initialValues?: GeneratorSchemaType;
}

/** Generator master create/edit — has no dedicated menu slot (same placement gap Slice G hit with
 * Facility master management), so it's folded into the Operation Log page as a dialog, reachable via
 * "Manage Generators", mirroring Slice G's FacilitySettingsPage precedent for otherwise-unhoused
 * master-data screens. */
export function GeneratorFormDialog({ open, onOpenChange, isSubmitting, onSubmit, initialValues }: GeneratorFormDialogProps) {
  const form = useForm<z.input<typeof generatorSchema>, unknown, GeneratorSchemaType>({
    resolver: zodResolver(generatorSchema),
    defaultValues: initialValues ?? { buildingId: '', name: '', model: '', capacityKva: undefined, location: '' },
  });

  useEffect(() => {
    if (open) form.reset(initialValues ?? { buildingId: '', name: '', model: '', capacityKva: undefined, location: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialValues]);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialValues ? 'Edit Generator' : 'New Generator'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="buildingId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Building</FormLabel>
                  <FormControl>
                    <BuildingSelect value={field.value} onValueChange={field.onChange} disabled={Boolean(initialValues)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="capacityKva"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity (kVA, optional)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : initialValues ? 'Save Changes' : 'Create Generator'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
