import { useState } from 'react';
import { toUserMessage } from '@/api/errors';
import type { PaymentDto } from '@/api/generated/mycondoApi';
import { useRecordPaymentIdempotentMutation } from '@/api/idempotentEndpoints';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  applyApiErrorToForm,
  toApiError,
} from '@/lib/forms/applyApiErrorToForm';
import { useIdempotencyKey } from '@/lib/idempotency/useIdempotencyKey';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { PageHeader } from '@/components/shared/PageHeader';
import {
  ResidentSelect,
  type ResidentSelectValue,
} from '@/components/shared/ResidentSelect';
import { AllocationSummary } from '../components/AllocationSummary';
import { PAYMENT_METHODS } from '../lib/constants';
import {
  recordPaymentSchema,
  type RecordPaymentSchemaType,
} from '../schemas/recordPaymentSchema';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function RecordPaymentPage() {
  const navigate = useNavigate();
  const [recordPayment, { isLoading }] = useRecordPaymentIdempotentMutation();
  const [idempotencyKey, resetIdempotencyKey] = useIdempotencyKey();
  const [error, setError] = useState<string | null>(null);
  const [resident, setResident] = useState<ResidentSelectValue | null>(null);
  const [recordedPayment, setRecordedPayment] = useState<PaymentDto | null>(
    null,
  );

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

  async function onSubmit(values: RecordPaymentSchemaType) {
    setError(null);

    try {
      const payment = await recordPayment({
        recordPaymentCommand: {
          flatId: values.flatId,
          amount: values.amount,
          paymentMethod: values.paymentMethod,
          referenceNumber: values.referenceNumber || null,
          businessDate: new Date(values.businessDate)
            .toISOString()
            .slice(0, 10),
          description: values.description || null,
        },
        idempotencyKey,
      }).unwrap();

      // No toast here — the persistent success view below (with amount, method, reference, and
      // allocations) already confirms the result; a toast on top of it was duplicate feedback.
      setRecordedPayment(payment);
      resetIdempotencyKey();
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError);
      if (!handled) {
        setError(toUserMessage(apiError ?? err));
      }
    }
  }

  if (recordedPayment) {
    return (
      <>
        <PageHeader
          title="Payment Recorded"
          crumbs={[
            { label: 'Finance' },
            { label: 'Payments' },
            { label: 'Record' },
          ]}
        />
        <Card>
          <CardContent className="max-w-xl pt-6 space-y-4">
            <Alert variant="success" appearance="light">
              <AlertTitle>
                Payment recorded for flat {recordedPayment.flatId}.
              </AlertTitle>
            </Alert>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">{recordedPayment.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span>{recordedPayment.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span>{recordedPayment.referenceNumber ?? '—'}</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1.5">
                Allocated against
              </div>
              <AllocationSummary allocations={recordedPayment.allocations} />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  navigate(`/billing/payments/${recordedPayment.paymentId}`)
                }
              >
                View Payment
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setRecordedPayment(null);
                  setResident(null);
                  form.reset({
                    ...form.getValues(),
                    flatId: '',
                    amount: 0,
                    referenceNumber: '',
                    description: '',
                  });
                }}
              >
                Record Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Record Payment"
        crumbs={[
          { label: 'Finance' },
          { label: 'Payments' },
          { label: 'Record' },
        ]}
      />
      <Card>
        <CardContent className="max-w-xl pt-6">
          {error && (
            <Alert
              variant="destructive"
              appearance="light"
              className="mb-4"
              onClose={() => setError(null)}
            >
              <AlertIcon>
                <AlertCircle />
              </AlertIcon>
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <FormLabel>Resident</FormLabel>
                <ResidentSelect
                  value={resident}
                  onChange={handleResidentChange}
                />
                {form.formState.errors.flatId && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.flatId.message}
                  </p>
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
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
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
                        <Input
                          placeholder="e.g. cheque or transaction number"
                          {...field}
                        />
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

              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Recording...' : 'Record Payment'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
