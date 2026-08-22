import { z } from 'zod';
import { isFutureDate } from '@/lib/date/age';
import { bangladeshMobileSchema, optionalBangladeshMobileSchema } from '@/lib/validation/bangladeshPhone';

// Step 2 of Flat Owner Registration — contact, identity, and family/professional details (the former
// separate "Additional Info" step folds in here so the wizard matches Tenant Registration's 5-step
// shape: Property & Ownership / Contact & Identity / Household / Documents / Review & Submit).
// Mirrors SaveOwnerResidentProfileCommand; National ID/passport follow the same masking discipline as
// OccupancyRegistration.PrimaryNationalIdNumber (see mycondo-api's IdentityMasking). NID, gender, DOB,
// mobile number, nationality, religion, present/permanent address, father's/mother's name, marital
// status, and profession are all mandatory; everything else stays optional.
export const ownerContactIdentitySchema = z.object({
  fullName: z.string().min(1, { message: 'Full name is required.' }).max(200),
  phone: bangladeshMobileSchema,
  alternatePhone: optionalBangladeshMobileSchema,
  email: z.string().email({ message: 'Enter a valid email address.' }).max(256).optional().or(z.literal('')),
  nationalIdNumber: z.string().min(1, { message: 'National ID is required.' }).max(50),
  passportNumber: z.string().max(50).optional().or(z.literal('')),
  dateOfBirth: z
    .string()
    .min(1, { message: 'Date of birth is required.' })
    .refine((value) => !isFutureDate(value), { message: 'Date of birth cannot be in the future.' }),
  gender: z.string().min(1, { message: 'Gender is required.' }),
  presentAddress: z.string().min(1, { message: 'Present address is required.' }).max(400),
  permanentAddress: z.string().min(1, { message: 'Permanent address is required.' }).max(400),
  bloodGroup: z.string().optional().or(z.literal('')),
  religion: z.string().min(1, { message: 'Religion is required.' }).max(50),
  nationality: z.string().min(1, { message: 'Nationality is required.' }).max(50),
  fatherName: z.string().min(1, { message: "Father's name is required." }).max(200),
  motherName: z.string().min(1, { message: "Mother's name is required." }).max(200),
  maritalStatus: z.string().min(1, { message: 'Marital status is required.' }),
  profession: z.string().min(1, { message: 'Profession is required.' }).max(200),
  employer: z.string().max(200).optional().or(z.literal('')),
  officeAddress: z.string().max(400).optional().or(z.literal('')),
  emergencyContactName: z.string().max(200).optional().or(z.literal('')),
  emergencyContactPhone: optionalBangladeshMobileSchema,
});

export type OwnerContactIdentitySchemaType = z.infer<typeof ownerContactIdentitySchema>;
