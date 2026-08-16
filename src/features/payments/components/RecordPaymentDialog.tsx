import { useState } from 'react';
import { toUserMessage } from '@/api/errors';
import { useRecordPaymentIdempotentMutation } from '@/api/idempotentEndpoints';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  applyApiErrorToForm,
  toApiError,
} from '@/lib/forms/applyApiErrorToForm';
import { useIdempotencyKey } from '@/lib/idempotency/useIdempotencyKey';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EntityFormDialog } from '@/components/shared/EntityFormDialog';
import {
  ResidentSelect,
  type ResidentSelectValue,
} from '@/components/shared/ResidentSelect';
import { PAYMENT_METHODS } from '../lib/constants';
import {
  recordPaymentSchema,
  type RecordPaymentSchemaType,
} from '../schemas/recordPaymentSchema';

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function RecordPaymentDialog({ open, onOpenChange }: RecordPaymentDialogProps) {
  const [recordPayment, { isLoading }] = useRecordPaymentIdempotentMutation();
  const [idempotencyKey, resetIdempotencyKey] = useIdempotencyKey();
  const [resident, setResident] = useState<ResidentSelectValue | null>(null);

  const form = useForm<RecordPaymentSchemaType>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      flatId: '',
      amount: 0,
      paymentMethod: undefined,
      referenceNumber: '',
      businessDate: today(),
      description: '',
    },
  });

  function handleResidentChange(picked: ResidentSelectValue | null) {
    setResident(picked);
    form.setValue('flatId', picked?.flatId ?? '', { shouldValidate: true });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      // Owning dialog is closing without a successful submit — next open must get a fresh key
      // (see useIdempotencyKey's contract: the same key must never span two distinct commands).
      resetIdempotencyKey();
      form.reset();
      setResident(null);
    }
    onOpenChange(nextOpen);
  }

  async function onSubmit(values: RecordPaymentSchemaType) {
    try {
      const payment = await recordPayment({
        recordPaymentCommand: {
          flatId: values.flatId,
          amount: values.amount,
          paymentMethod: values.paymentMethod,
          referenceNumber: values.referenceNumber || null,
          businessDate: new Date(values.businessDate).toISOString().slice(0, 10),
          description: values.description || null,
        },
        idempotencyKey,
      }).unwrap();

      toast.success(`Payment of ${payment.amount} recorded for flat ${payment.flatId}.`);
      resetIdempotencyKey();
      form.reset();
      setResident(null);
      onOpenChange(false);
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError);
      if (!handled) {
        toast.error(toUserMessage(apiError ?? err));
      }
    }
  }

  return (
    <EntityFormDialog open={open} onOpenChange={handleOpenChange} title="Record Payment">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <FormLabel>Resident</FormLabel>
            <ResidentSelect value={resident} onChange={handleResidentChange} />
            {form.formState.errors.flatId && (
              <p className="text-destructive text-sm">{form.formState.errors.flatId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (BDT)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Method</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="businessDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. cheque or transaction number" {...field} />
                  </FormControl>
                  <FormMessage />
                  <p className="text-muted-foreground text-xs">
                    User-supplied — not a system-generated receipt number.
                  </p>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (optional)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Recording…' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </EntityFormDialog>
  );
}
