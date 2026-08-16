import { z } from 'zod';
import { isFutureDate } from '@/lib/date/age';
import { optionalBangladeshMobileSchema } from '@/lib/validation/bangladeshPhone';

// Step 3 of the Tenant Registration wizard — one row of the household member list. Mirrors
// AddHouseholdMemberRequest/UpdateHouseholdMemberRequest. Relationship is still a free-text field on
// the backend (existing Tenant household data isn't being migrated to an enum), but the UI only offers
// Father/Mother/Spouse/Child, matching the Owner-side Household step. A Child requires at least one of
// National ID / Birth Certificate number (mirrored server-side by HouseholdMember's own guard).
export const householdMemberSchema = z
  .object({
    fullName: z.string().min(1, { message: 'Full name is required.' }).max(200),
    relationshipToPrimary: z.string().min(1, { message: 'Relationship is required.' }).max(50),
    dateOfBirth: z
      .string()
      .min(1, { message: 'Date of birth is required.' })
      .refine((value) => !isFutureDate(value), {
        message: 'Date of birth cannot be in the future.',
      }),
    gender: z.string().min(1, { message: 'Gender is required.' }),
    phone: optionalBangladeshMobileSchema,
    nationalIdNumber: z.string().max(50).optional().or(z.literal('')),
    birthCertificateNumber: z.string().max(50).optional().or(z.literal('')),
    bloodGroup: z.string().optional().or(z.literal('')),
    religion: z.string().max(50).optional().or(z.literal('')),
    nationality: z.string().max(50).optional().or(z.literal('')),
    occupation: z.string().max(200).optional().or(z.literal('')),
  })
  .refine(
    (data) => data.relationshipToPrimary !== 'Child' || !!data.nationalIdNumber || !!data.birthCertificateNumber,
    {
      message: 'A Child requires either a National ID or a Birth Certificate number.',
      path: ['birthCertificateNumber'],
    },
  );

export type HouseholdMemberSchemaType = z.infer<typeof householdMemberSchema>;
