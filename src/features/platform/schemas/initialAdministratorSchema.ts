import { z } from 'zod';
import { passwordSchema } from '@/lib/validation/password';

// Password rule mirrors the backend's shared MustBeAStrongPassword rule — there is no email/invitation
// infrastructure in this codebase yet, so the Platform SuperAdmin must set the founding
// administrator's password directly here.
export const initialAdministratorSchema = z.object({
  fullName: z.string().trim().min(1, { message: 'Full name is required.' }).max(200),
  email: z.string().trim().email({ message: 'Please enter a valid email address.' }).max(320),
  password: passwordSchema,
});

export type InitialAdministratorSchemaType = z.infer<typeof initialAdministratorSchema>;
