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
import { reconciliationSchema, type ReconciliationSchemaType } from '../schemas/stockSchema';

interface ReconciliationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting?: boolean;
  onSubmit: (values: ReconciliationSchemaType) => void;
}

/** Opening/closing stock and totals are all computed server-side from the stock-movement ledger
 * (CreateMonthlyReconciliationCommandHandler) — this form only captures which cylinder type/month to
 * reconcile and an optional remark. */
export function ReconciliationDialog({ open, onOpenChange, isSubmitting, onSubmit }: ReconciliationDialogProps) {
  const form = useForm<ReconciliationSchemaType>({
    resolver: zodResolver(reconciliationSchema),
    defaultValues: { cylinderType: '', periodMonth: new Date().toISOString().slice(0, 7), remarks: '' },
  });

  function handleOpenChange(next: boolean) {
    if (!next) form.reset();
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Monthly Reconciliation</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cylinderType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cylinder type</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. LPG-12kg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="periodMonth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Period month</FormLabel>
                  <FormControl>
                    <Input type="month" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
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
                {isSubmitting ? 'Creating…' : 'Create Reconciliation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
