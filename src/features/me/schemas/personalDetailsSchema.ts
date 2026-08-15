import { z } from 'zod';

// Mirrors UpdateMyProfileCommandValidator on the backend (max lengths) — the backend remains
// authoritative; this only gives the user immediate feedback before a round trip.
export const personalDetailsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, { message: 'Full name is required.' })
    .max(200, { message: 'Full name is too long.' }),
  phoneNumber: z
    .string()
    .trim()
    .max(40, { message: 'Phone number is too long.' })
    .optional()
    .or(z.literal('')),
});

export type PersonalDetailsSchemaType = z.infer<typeof personalDetailsSchema>;
