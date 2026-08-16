import { z } from 'zod';
import { bangladeshMobileSchema } from '@/lib/validation/bangladeshPhone';

// Mirrors CreateGuestProfileCommand (mycondo-api Features/Security/Guests) — fullName/phone
// required, identity document fields optional. No other fields exist on the backend command.
export const createGuestProfileSchema = z.object({
  fullName: z.string().min(1, { message: 'Full name is required.' }).max(200),
  phone: bangladeshMobileSchema,
  identityDocumentType: z.string().max(64).optional(),
  identityDocumentNumber: z.string().max(64).optional(),
});

export type CreateGuestProfileSchemaType = z.infer<typeof createGuestProfileSchema>;
