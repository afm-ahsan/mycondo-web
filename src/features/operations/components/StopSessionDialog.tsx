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
import { stopSessionSchema, type StopSessionSchemaType } from '../schemas/generatorSessionSchema';

interface StopSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting?: boolean;
  onSubmit: (values: StopSessionSchemaType) => void;
}

export function StopSessionDialog({ open, onOpenChange, isSubmitting, onSubmit }: StopSessionDialogProps) {
  const form = useForm<StopSessionSchemaType>({
    resolver: zodResolver(stopSessionSchema),
    defaultValues: { closingFuelLevel: 0, outageReason: '', hourMeterReading: undefined },
  });

  function handleOpenChange(next: boolean) {
    if (!next) form.reset();
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stop Generator Session</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="closingFuelLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Closing fuel level</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hourMeterReading"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hour meter reading (optional)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="outageReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outage reason (optional)</FormLabel>
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
                {isSubmitting ? 'Stopping…' : 'Stop Session'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
