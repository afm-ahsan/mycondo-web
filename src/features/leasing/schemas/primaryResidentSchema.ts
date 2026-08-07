import { z } from 'zod';

// Step 2 of the Tenant Registration wizard — the primary occupant's identity/contact details.
// Mirrors UpdateOccupancyRegistrationDraftRequest.
export const primaryResidentSchema = z.object({
  primaryFullName: z.string().min(1, { message: 'Full name is required.' }).max(200),
  primaryPhone: z.string().max(30).optional(),
  primaryEmail: z.string().email({ message: 'Enter a valid email address.' }).max(200).optional().or(z.literal('')),
  primaryNationalIdNumber: z.string().max(50).optional(),
  primaryDateOfBirth: z.string().optional(),
  primaryPermanentAddress: z.string().max(500).optional(),
  emergencyContactName: z.string().max(200).optional(),
  emergencyContactPhone: z.string().max(30).optional(),
});

export type PrimaryResidentSchemaType = z.infer<typeof primaryResidentSchema>;
