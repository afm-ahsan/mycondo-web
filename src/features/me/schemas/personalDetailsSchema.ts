import { z } from 'zod';
import { optionalBangladeshMobileSchema } from '@/lib/validation/bangladeshPhone';

// Mirrors UpdateMyProfileCommandValidator on the backend (max lengths) — the backend remains
// authoritative; this only gives the user immediate feedback before a round trip.
export const personalDetailsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, { message: 'Full name is required.' })
    .max(200, { message: 'Full name is too long.' }),
  phoneNumber: optionalBangladeshMobileSchema,
});

export type PersonalDetailsSchemaType = z.infer<typeof personalDetailsSchema>;
