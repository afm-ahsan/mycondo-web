import { z } from 'zod';
import { isFutureDate } from '@/lib/date/age';
import { bangladeshMobileSchema, optionalBangladeshMobileSchema } from '@/lib/validation/bangladeshPhone';

// Step 2 of the Tenant Registration wizard — the primary occupant's identity/contact details.
// Mirrors UpdateOccupancyRegistrationDraftRequest. Mobile, NID, gender, DOB, religion, nationality,
// father's/mother's name, marital status, profession, and permanent address are all mandatory —
// mirrored by OccupancyRegistrationDraftCommandValidator server-side (see
// ownerContactIdentitySchema.ts for the equivalent Flat Owner Registration pattern this follows).
export const primaryResidentSchema = z.object({
  primaryFullName: z.string().min(1, { message: 'Full name is required.' }).max(200),
  primaryPhone: bangladeshMobileSchema,
  primaryEmail: z.string().email({ message: 'Enter a valid email address.' }).max(200).optional().or(z.literal('')),
  primaryNationalIdNumber: z.string().min(1, { message: 'National ID is required.' }).max(50),
  primaryDateOfBirth: z
    .string()
    .min(1, { message: 'Date of birth is required.' })
    .refine((value) => !isFutureDate(value), { message: 'Date of birth cannot be in the future.' }),
  primaryGender: z.string().min(1, { message: 'Gender is required.' }),
  primaryBloodGroup: z.string().optional().or(z.literal('')),
  primaryReligion: z.string().min(1, { message: 'Religion is required.' }).max(50),
  primaryNationality: z.string().min(1, { message: 'Nationality is required.' }).max(50),
  primaryFatherName: z.string().min(1, { message: "Father's name is required." }).max(200),
  primaryMotherName: z.string().min(1, { message: "Mother's name is required." }).max(200),
  primaryMaritalStatus: z.string().min(1, { message: 'Marital status is required.' }),
  primaryProfession: z.string().min(1, { message: 'Profession is required.' }).max(200),
  primaryPermanentAddress: z.string().min(1, { message: 'Permanent address is required.' }).max(500),
  emergencyContactName: z.string().max(200).optional(),
  emergencyContactPhone: optionalBangladeshMobileSchema,
});

export type PrimaryResidentSchemaType = z.infer<typeof primaryResidentSchema>;
