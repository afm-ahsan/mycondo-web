import { useState } from 'react';
import { toUserMessage } from '@/api/errors';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  applyApiErrorToForm,
  toApiError,
} from '@/lib/forms/applyApiErrorToForm';
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
import { PageHeader } from '@/components/shared/PageHeader';
import { useRecordReading } from '../api/readingsApi';
import type { UtilityType } from '../lib/constants';
import {
  recordReadingSchema,
  type RecordReadingSchemaType,
} from '../schemas/recordReadingSchema';

interface ReadingCapturePageProps {
  utilityType: UtilityType;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Consumption/charge preview is intentionally NOT shown here — the backend has no dry-run/preview
 * endpoint for a reading (confirmed against the contract); consumption and charge are only
 * server-computed at Finalize/Bill time. Continuity's override reason field is only revealed after
 * the backend actually rejects with a continuity conflict — never pre-shown, per the UX-3 spec.
 */
export function ReadingCapturePage({ utilityType }: ReadingCapturePageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const meterId = searchParams.get('meterId') ?? '';
  const [recordReading, { isLoading }] = useRecordReading();
  const [error, setError] = useState<string | null>(null);
  const [showOverride, setShowOverride] = useState(false);

  const form = useForm<RecordReadingSchemaType>({
    resolver: zodResolver(recordReadingSchema),
    defaultValues: {
      meterId,
      periodStart: today(),
      periodEnd: today(),
      previousReading: 0,
      presentReading: 0,
      readingDate: today(),
      overrideReason: '',
    },
  });

  async function onSubmit(values: RecordReadingSchemaType) {
    setError(null);

    try {
      const reading = await recordReading({
        recordReadingCommand: {
          meterId: values.meterId,
          periodStart: values.periodStart,
          periodEnd: values.periodEnd,
          previousReading: values.previousReading,
          presentReading: values.presentReading,
          readingDate: values.readingDate,
          overrideReason: values.overrideReason || null,
        },
      }).unwrap();

      toast.success('Reading captured.');
      navigate(
        `/utilities/${utilityType.toLowerCase()}/readings/${reading.readingId}`,
      );
    } catch (err) {
      const apiError = toApiError(err);
      // A continuity mismatch surfaces as a 409 Conflict — reveal the override field reactively
      // rather than pre-showing it, per "require override reason only when API indicates it is needed."
      if (apiError?.isConflict) {
        setShowOverride(true);
        setError(toUserMessage(apiError));
        return;
      }
      const handled = applyApiErrorToForm(form, apiError);
      if (!handled) {
        setError(toUserMessage(apiError ?? err));
      }
    }
  }

  return (
    <>
      <PageHeader
        title={`Capture ${utilityType} Reading`}
        crumbs={[
          { label: 'Finance' },
          { label: utilityType },
          { label: 'Capture Reading' },
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="periodStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period start</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="periodEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period end</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="previousReading"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Previous reading</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="presentReading"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Present reading</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="readingDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reading date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {showOverride && (
                <FormField
                  control={form.control}
                  name="overrideReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Override reason (required — previous reading
                        doesn&rsquo;t match the meter&rsquo;s last finalized
                        reading)
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <Button type="submit" disabled={isLoading || !meterId}>
                {isLoading ? 'Saving...' : 'Capture Reading'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
