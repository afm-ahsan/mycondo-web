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
import { formatBdt } from '../lib/format';
import { inspectBookingSchema, type InspectBookingSchemaType } from '../schemas/bookingActionSchemas';

interface InspectBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting?: boolean;
  depositAmount: number;
  onSubmit: (values: InspectBookingSchemaType) => void;
}

/** Post-event inspection — notes + optional damage deduction. Deposit refund/forfeiture is computed
 * entirely server-side from the deduction amount; this form only captures the inspector's inputs. */
export function InspectBookingDialog({
  open,
  onOpenChange,
  isSubmitting,
  depositAmount,
  onSubmit,
}: InspectBookingDialogProps) {
  const form = useForm<InspectBookingSchemaType>({
    resolver: zodResolver(inspectBookingSchema),
    defaultValues: { notes: '', damageDeductionAmount: undefined, damageDeductionReason: '' },
  });

  function handleOpenChange(next: boolean) {
    if (!next) form.reset();
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Post-event inspection</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-muted-foreground text-sm">Deposit held: {formatBdt(depositAmount)}</p>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inspection notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="damageDeductionAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Damage deduction amount (optional)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="damageDeductionReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Damage deduction reason</FormLabel>
                  <FormControl>
                    <Input placeholder="Required if a deduction amount is entered" {...field} />
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
                {isSubmitting ? 'Submitting…' : 'Close After Inspection'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
