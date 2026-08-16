import { z } from 'zod';
import { isFutureDate } from '@/lib/date/age';

// Flat Owner Registration's Household step — Father/Mother/Spouse/Child family members recorded
// against the primary owner's Resident. Mirrors AddOwnerHouseholdMemberRequest/
// UpdateOwnerHouseholdMemberRequest; a Child requires at least one of National ID / Birth Certificate
// number (mirrored server-side by ResidentHouseholdMember's own guard).
export const ownerHouseholdMemberSchema = z
  .object({
    fullName: z.string().min(1, { message: 'Full name is required.' }).max(200),
    relationshipType: z.string().min(1, { message: 'Relationship is required.' }),
    gender: z.string().min(1, { message: 'Gender is required.' }),
    dateOfBirth: z
      .string()
      .min(1, { message: 'Date of birth is required.' })
      .refine((value) => !isFutureDate(value), {
        message: 'Date of birth cannot be in the future.',
      }),
    nationalIdNumber: z.string().max(50).optional().or(z.literal('')),
    birthCertificateNumber: z.string().max(50).optional().or(z.literal('')),
    bloodGroup: z.string().optional().or(z.literal('')),
    religion: z.string().max(50).optional().or(z.literal('')),
    nationality: z.string().max(50).optional().or(z.literal('')),
    occupation: z.string().max(200).optional().or(z.literal('')),
  })
  .refine(
    (data) => data.relationshipType !== 'Child' || !!data.nationalIdNumber || !!data.birthCertificateNumber,
    {
      message: 'A Child requires either a National ID or a Birth Certificate number.',
      path: ['birthCertificateNumber'],
    },
  );

export type OwnerHouseholdMemberSchemaType = z.infer<typeof ownerHouseholdMemberSchema>;
