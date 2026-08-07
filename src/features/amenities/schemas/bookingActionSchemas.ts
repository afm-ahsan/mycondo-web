import { z } from 'zod';

// Mirrors RejectBookingRequest / CancelBookingRequest (mycondo-api Features/Amenities/Bookings).
export const bookingReasonSchema = z.object({
  reason: z.string().min(1, { message: 'A reason is required.' }).max(500),
});

export type BookingReasonSchemaType = z.infer<typeof bookingReasonSchema>;

// Mirrors InspectBookingRequest — damageDeductionAmount/Reason are optional together; the backend
// itself requires a reason once an amount is positive (InspectBookingCommandHandler), enforced here
// too so the error surfaces before submit rather than as a 409 round-trip.
export const inspectBookingSchema = z
  .object({
    notes: z.string().max(2000).optional(),
    damageDeductionAmount: z.coerce.number().min(0).optional(),
    damageDeductionReason: z.string().max(500).optional(),
  })
  .refine((value) => !value.damageDeductionAmount || value.damageDeductionAmount === 0 || !!value.damageDeductionReason, {
    message: 'A reason is required when a damage deduction amount is entered.',
    path: ['damageDeductionReason'],
  });

export type InspectBookingSchemaType = z.infer<typeof inspectBookingSchema>;
