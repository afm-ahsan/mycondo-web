import { z } from 'zod';

// Step 3 of Flat Owner Registration — family/professional details and emergency contact. All
// optional: only what the paper register commonly asks for, not every conceivable field.
export const ownerAdditionalInfoSchema = z.object({
  fatherName: z.string().max(200).optional().or(z.literal('')),
  motherName: z.string().max(200).optional().or(z.literal('')),
  maritalStatus: z.string().optional().or(z.literal('')),
  profession: z.string().max(200).optional().or(z.literal('')),
  employer: z.string().max(200).optional().or(z.literal('')),
  officeAddress: z.string().max(400).optional().or(z.literal('')),
  emergencyContactName: z.string().max(200).optional().or(z.literal('')),
  emergencyContactPhone: z.string().max(20).optional().or(z.literal('')),
});

export type OwnerAdditionalInfoSchemaType = z.infer<typeof ownerAdditionalInfoSchema>;
