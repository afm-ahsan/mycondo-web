import { z } from 'zod';
import { isFutureDate } from '@/lib/date/age';
import { optionalBangladeshMobileSchema } from '@/lib/validation/bangladeshPhone';

// Step 2 of Flat Owner Registration — contact, identity, and family/professional details (the former
// separate "Additional Info" step folds in here so the wizard matches Tenant Registration's 5-step
// shape: Property & Ownership / Contact & Identity / Household / Documents / Review & Submit).
// Mirrors SaveOwnerResidentProfileCommand; National ID/passport follow the same masking discipline as
// OccupancyRegistration.PrimaryNationalIdNumber (see mycondo-api's IdentityMasking). NID, gender, and
// DOB are mandatory per MVP-1's Owner/Tenant identity requirements; everything else stays optional.
export const ownerContactIdentitySchema = z.object({
  fullName: z.string().min(1, { message: 'Full name is required.' }).max(200),
  phone: optionalBangladeshMobileSchema,
  alternatePhone: optionalBangladeshMobileSchema,
  email: z.string().email({ message: 'Enter a valid email address.' }).max(256).optional().or(z.literal('')),
  nationalIdNumber: z.string().min(1, { message: 'National ID is required.' }).max(50),
  passportNumber: z.string().max(50).optional().or(z.literal('')),
  dateOfBirth: z
    .string()
    .min(1, { message: 'Date of birth is required.' })
    .refine((value) => !isFutureDate(value), { message: 'Date of birth cannot be in the future.' }),
  gender: z.string().min(1, { message: 'Gender is required.' }),
  presentAddress: z.string().max(400).optional().or(z.literal('')),
  permanentAddress: z.string().max(400).optional().or(z.literal('')),
  bloodGroup: z.string().optional().or(z.literal('')),
  religion: z.string().max(50).optional().or(z.literal('')),
  nationality: z.string().max(50).optional().or(z.literal('')),
  fatherName: z.string().max(200).optional().or(z.literal('')),
  motherName: z.string().max(200).optional().or(z.literal('')),
  maritalStatus: z.string().optional().or(z.literal('')),
  profession: z.string().max(200).optional().or(z.literal('')),
  employer: z.string().max(200).optional().or(z.literal('')),
  officeAddress: z.string().max(400).optional().or(z.literal('')),
  emergencyContactName: z.string().max(200).optional().or(z.literal('')),
  emergencyContactPhone: optionalBangladeshMobileSchema,
});

export type OwnerContactIdentitySchemaType = z.infer<typeof ownerContactIdentitySchema>;
