import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { GeneratorSelect } from '@/components/shared/GeneratorSelect';
import { maintenanceScheduleSchema, type MaintenanceScheduleSchemaType } from '../schemas/maintenanceSchema';

interface MaintenanceScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting?: boolean;
  onSubmit: (values: MaintenanceScheduleSchemaType) => void;
}

export function MaintenanceScheduleDialog({ open, onOpenChange, isSubmitting, onSubmit }: MaintenanceScheduleDialogProps) {
  const form = useForm<MaintenanceScheduleSchemaType>({
    resolver: zodResolver(maintenanceScheduleSchema),
    defaultValues: { generatorId: '', nextDueDate: '', nextDueHourMeterReading: undefined },
  });

  function handleOpenChange(next: boolean) {
    if (!next) form.reset();
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Maintenance Schedule</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="generatorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Generator</FormLabel>
                  <FormControl>
                    <GeneratorSelect value={field.value} onValueChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nextDueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next due date (optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nextDueHourMeterReading"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next due hour meter reading (optional)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" {...field} value={field.value ?? ''} />
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
                {isSubmitting ? 'Creating…' : 'Create Schedule'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
