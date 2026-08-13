import { z } from 'zod';

// Step 2 of Flat Owner Registration — contact and identity details. Mirrors the base fields of
// RegisterFlatOwnerCommand; National ID/passport follow the same masking discipline as
// OccupancyRegistration.PrimaryNationalIdNumber (see mycondo-api's IdentityMasking).
export const ownerContactIdentitySchema = z.object({
  fullName: z.string().min(1, { message: 'Full name is required.' }).max(200),
  phone: z.string().max(20).optional().or(z.literal('')),
  alternatePhone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email({ message: 'Enter a valid email address.' }).max(256).optional().or(z.literal('')),
  nationalIdNumber: z.string().max(50).optional().or(z.literal('')),
  passportNumber: z.string().max(50).optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  presentAddress: z.string().max(400).optional().or(z.literal('')),
  permanentAddress: z.string().max(400).optional().or(z.literal('')),
});

export type OwnerContactIdentitySchemaType = z.infer<typeof ownerContactIdentitySchema>;
