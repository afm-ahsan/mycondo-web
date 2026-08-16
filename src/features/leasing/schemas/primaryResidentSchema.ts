import { z } from 'zod';
import { isFutureDate } from '@/lib/date/age';
import { optionalBangladeshMobileSchema } from '@/lib/validation/bangladeshPhone';

// Step 2 of the Tenant Registration wizard — the primary occupant's identity/contact details.
// Mirrors UpdateOccupancyRegistrationDraftRequest. NID, gender, and DOB are mandatory per MVP-1's
// Owner/Tenant identity requirements (mirrored by OccupancyRegistration.Submit()'s own guard).
export const primaryResidentSchema = z.object({
  primaryFullName: z.string().min(1, { message: 'Full name is required.' }).max(200),
  primaryPhone: optionalBangladeshMobileSchema,
  primaryEmail: z.string().email({ message: 'Enter a valid email address.' }).max(200).optional().or(z.literal('')),
  primaryNationalIdNumber: z.string().min(1, { message: 'National ID is required.' }).max(50),
  primaryDateOfBirth: z
    .string()
    .min(1, { message: 'Date of birth is required.' })
    .refine((value) => !isFutureDate(value), { message: 'Date of birth cannot be in the future.' }),
  primaryGender: z.string().min(1, { message: 'Gender is required.' }),
  primaryBloodGroup: z.string().optional().or(z.literal('')),
  primaryReligion: z.string().max(50).optional().or(z.literal('')),
  primaryNationality: z.string().max(50).optional().or(z.literal('')),
  primaryProfession: z.string().max(200).optional().or(z.literal('')),
  primaryPermanentAddress: z.string().max(500).optional(),
  emergencyContactName: z.string().max(200).optional(),
  emergencyContactPhone: optionalBangladeshMobileSchema,
});

export type PrimaryResidentSchemaType = z.infer<typeof primaryResidentSchema>;
