import { z } from 'zod';
import { optionalBangladeshMobileSchema } from '@/lib/validation/bangladeshPhone';

// Step 3 of the Tenant Registration wizard — one row of the household member list. Mirrors
// AddHouseholdMemberRequest.
export const householdMemberSchema = z.object({
  fullName: z.string().min(1, { message: 'Full name is required.' }).max(200),
  relationshipToPrimary: z.string().min(1, { message: 'Relationship is required.' }).max(50),
  dateOfBirth: z.string().optional(),
  phone: optionalBangladeshMobileSchema,
  nationalIdNumber: z.string().max(50).optional(),
});

export type HouseholdMemberSchemaType = z.infer<typeof householdMemberSchema>;
