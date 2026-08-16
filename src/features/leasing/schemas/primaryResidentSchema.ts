import { z } from 'zod';
import { optionalBangladeshMobileSchema } from '@/lib/validation/bangladeshPhone';

// Step 2 of the Tenant Registration wizard — the primary occupant's identity/contact details.
// Mirrors UpdateOccupancyRegistrationDraftRequest.
export const primaryResidentSchema = z.object({
  primaryFullName: z.string().min(1, { message: 'Full name is required.' }).max(200),
  primaryPhone: optionalBangladeshMobileSchema,
  primaryEmail: z.string().email({ message: 'Enter a valid email address.' }).max(200).optional().or(z.literal('')),
  primaryNationalIdNumber: z.string().max(50).optional(),
  primaryDateOfBirth: z.string().optional(),
  primaryPermanentAddress: z.string().max(500).optional(),
  emergencyContactName: z.string().max(200).optional(),
  emergencyContactPhone: optionalBangladeshMobileSchema,
});

export type PrimaryResidentSchemaType = z.infer<typeof primaryResidentSchema>;
