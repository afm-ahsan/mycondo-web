import { z } from 'zod';

// Mirrors RequestBookingCommand (mycondo-api Features/Amenities/Bookings/RequestBooking) — eventDate/
// startTime/endTime are UI-only fields combined into startAtUtc/endAtUtc before the command is sent
// (the backend takes one absolute instant, not a separate date+time pair). residentId is UI-only too
// (drives ResidentSelect); flatId is what's actually sent, resolved from the selected resident.
//
// IMPORTANT contract gap, found while building this screen (not caught during regeneration/review —
// disclosed in the Slice G completion report): RequestBookingCommand has no `notes` or add-on-services
// field at all, and neither does the `Booking` domain entity. The spec's "Add-on services"/"Notes"
// create-form fields have nowhere to be persisted — folding free text into `eventType` would pollute a
// short categorical field and silently discarding what the resident typed would be worse (looks like
// data loss). Both fields are dropped from this form rather than faked.
export const bookingRequestSchema = z.object({
  facilityId: z.string().min(1, { message: 'Hall is required.' }),
  residentId: z.string().min(1, { message: 'Search for and select a resident first.' }),
  flatId: z.string().min(1, { message: 'A flat is required.' }),
  eventType: z.string().min(1, { message: 'Event type is required.' }).max(120),
  eventDate: z.string().min(1, { message: 'Event date is required.' }),
  startTime: z.string().min(1, { message: 'Start time is required.' }),
  endTime: z.string().min(1, { message: 'End time is required.' }),
  setupBufferMinutes: z.coerce.number().int().min(0),
  cleanupBufferMinutes: z.coerce.number().int().min(0),
  expectedGuestCount: z.coerce.number().int().positive({ message: 'Expected guests must be positive.' }),
  termsAccepted: z.boolean().refine((value) => value, { message: 'Terms must be accepted.' }),
});

export type BookingRequestSchemaType = z.infer<typeof bookingRequestSchema>;
