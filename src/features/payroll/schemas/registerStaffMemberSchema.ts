import { z } from 'zod';
import { optionalBangladeshMobileSchema } from '@/lib/validation/bangladeshPhone';
import { STAFF_ROLES } from '../lib/constants';

// Mirrors RegisterStaffMemberCommand (mycondo-api Features/Payroll/StaffMembers).
export const registerStaffMemberSchema = z.object({
  fullName: z.string().min(1, { message: 'Full name is required.' }).max(200),
  role: z.enum(STAFF_ROLES, { message: 'Role is required.' }),
  phone: optionalBangladeshMobileSchema,
});

export type RegisterStaffMemberSchemaType = z.infer<typeof registerStaffMemberSchema>;
