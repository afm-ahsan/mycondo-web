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
import { startSessionSchema, type StartSessionSchemaType } from '../schemas/generatorSessionSchema';

interface StartSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting?: boolean;
  onSubmit: (values: StartSessionSchemaType) => void;
}

export function StartSessionDialog({ open, onOpenChange, isSubmitting, onSubmit }: StartSessionDialogProps) {
  const form = useForm<StartSessionSchemaType>({
    resolver: zodResolver(startSessionSchema),
    defaultValues: { generatorId: '', openingFuelLevel: 0 },
  });

  function handleOpenChange(next: boolean) {
    if (!next) form.reset();
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Generator Session</DialogTitle>
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
              name="openingFuelLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opening fuel level</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" {...field} />
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
                {isSubmitting ? 'Starting…' : 'Start Session'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
