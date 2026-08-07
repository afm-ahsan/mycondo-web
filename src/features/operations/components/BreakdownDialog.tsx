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
import { Textarea } from '@/components/ui/textarea';
import { GeneratorSelect } from '@/components/shared/GeneratorSelect';
import { breakdownSchema, type BreakdownSchemaType } from '../schemas/maintenanceSchema';

interface BreakdownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting?: boolean;
  onSubmit: (values: BreakdownSchemaType) => void;
}

export function BreakdownDialog({ open, onOpenChange, isSubmitting, onSubmit }: BreakdownDialogProps) {
  const now = new Date().toISOString().slice(0, 16);
  const form = useForm<BreakdownSchemaType>({
    resolver: zodResolver(breakdownSchema),
    defaultValues: { generatorId: '', reportedAtUtc: now, description: '', downtimeStartUtc: now },
  });

  function handleOpenChange(next: boolean) {
    if (!next) form.reset();
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Breakdown</DialogTitle>
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
              name="downtimeStartUtc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Downtime start</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
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
                {isSubmitting ? 'Reporting…' : 'Report Breakdown'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
