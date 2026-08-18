import { useState } from 'react';
import { toUserMessage } from '@/api/errors';
import { zodResolver } from '@hookform/resolvers/zod';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  applyApiErrorToForm,
  toApiError,
} from '@/lib/forms/applyApiErrorToForm';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FacilitySelect } from '@/components/shared/FacilitySelect';
import { PageHeader } from '@/components/shared/PageHeader';
import { ResidentSelect } from '@/components/shared/ResidentSelect';
import { useRequestBooking } from '../../api/bookingsApi';
import { useFacility } from '../../api/facilitiesApi';
import { AvailabilityPanel } from '../../components/AvailabilityPanel';
import {
  bookingRequestSchema,
  type BookingRequestSchemaType,
} from '../../schemas/bookingRequestSchema';

/**
 * Create-only — mycondo-api's Bookings feature has no update/edit endpoint (only RequestBooking,
 * plus the lifecycle-transition commands). "Edit booking while status permits" (requirement B.4) has
 * no backend contract to implement against; a Draft booking can only be Submitted or Cancelled, not
 * field-edited. Disclosed as a backend gap in the Slice G completion report — a genuine finding from
 * this "identify contract mismatches before implementing screens" step, not a frontend omission.
 */
export function BookingFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [requestBooking, { isLoading }] = useRequestBooking();
  const [pageError, setPageError] = useState<string | null>(null);

  const form = useForm<BookingRequestSchemaType>({
    resolver: zodResolver(bookingRequestSchema),
    defaultValues: {
      facilityId: searchParams.get('facilityId') ?? '',
      residentId: '',
      flatId: '',
      eventType: '',
      eventDate: '',
      startTime: '',
      endTime: '',
      setupBufferMinutes: 0,
      cleanupBufferMinutes: 0,
      expectedGuestCount: 1,
      termsAccepted: false,
    },
  });

  const facilityId = form.watch('facilityId');
  const { data: facility } = useFacility(
    facilityId ? { id: facilityId } : skipToken,
  );

  async function onSubmit(values: BookingRequestSchemaType) {
    setPageError(null);
    const startAtUtc = new Date(
      `${values.eventDate}T${values.startTime}`,
    ).toISOString();
    const endAtUtc = new Date(
      `${values.eventDate}T${values.endTime}`,
    ).toISOString();

    try {
      const booking = await requestBooking({
        requestBookingCommand: {
          facilityId: values.facilityId,
          flatId: values.flatId,
          eventType: values.eventType,
          startAtUtc,
          endAtUtc,
          setupBufferMinutes: values.setupBufferMinutes,
          cleanupBufferMinutes: values.cleanupBufferMinutes,
          expectedGuestCount: values.expectedGuestCount,
          termsAccepted: values.termsAccepted,
        },
      }).unwrap();
      toast.success('Booking requested.');
      navigate(`/facilities/community-hall/bookings/${booking.bookingId}`);
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError);
      if (!handled) {
        // A 409 (overlap/capacity conflict) isn't attributable to one field — page-level alert per
        // Slice G plan §5.
        setPageError(toUserMessage(apiError ?? err));
      }
    }
  }

  return (
    <>
      <PageHeader
        title="New Booking"
        crumbs={[
          { label: 'Facilities' },
          { label: 'Community Hall', path: '/facilities/community-hall/bookings' },
          { label: 'New Booking' },
        ]}
      />

      <div className="space-y-4">
        {pageError && (
          <Alert
            variant="destructive"
            appearance="light"
            onClose={() => setPageError(null)}
          >
            <AlertIcon>
              <AlertTriangle />
            </AlertIcon>
            <AlertTitle>{pageError}</AlertTitle>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Booking details</CardTitle>
          </CardHeader>
          <CardContent className="max-w-2xl">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="facilityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hall</FormLabel>
                      <FormControl>
                        <FacilitySelect
                          facilityType="CommunityHall"
                          value={field.value}
                          onValueChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="residentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resident</FormLabel>
                      <FormControl>
                        <ResidentSelect
                          value={
                            field.value
                              ? {
                                  residentId: field.value,
                                  flatId: form.getValues('flatId'),
                                  fullName: '',
                                  phone: null,
                                }
                              : null
                          }
                          onChange={(resident) => {
                            field.onChange(resident?.residentId ?? '');
                            form.setValue('flatId', resident?.flatId ?? '');
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Birthday party" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="eventDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="expectedGuestCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected guests</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="setupBufferMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Setup buffer (min)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cleanupBufferMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cleanup buffer (min)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Alert variant="warning" appearance="light">
                  <AlertIcon>
                    <AlertTriangle />
                  </AlertIcon>
                  <AlertTitle>
                    Add-on services and notes aren&apos;t captured here — the
                    booking API has no field for them yet. Coordinate any
                    special requests with building management directly.
                  </AlertTitle>
                </Alert>

                <FormField
                  control={form.control}
                  name="termsAccepted"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        I accept the facility's terms and conditions
                      </FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {facility && <AvailabilityPanel facility={facility} />}

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Submitting…' : 'Request Booking'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
