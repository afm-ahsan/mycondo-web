import { z } from 'zod';

// Password rule mirrors the backend's RegisterUserCommandValidator/ProvisionOrganizationWithAdminCommandValidator
// exactly (min 12, upper, lower, digit) — there is no email/invitation infrastructure in this codebase
// yet, so the Platform SuperAdmin must set the founding administrator's password directly here.
export const initialAdministratorSchema = z.object({
  fullName: z.string().trim().min(1, { message: 'Full name is required.' }).max(200),
  email: z.string().trim().email({ message: 'Please enter a valid email address.' }).max(320),
  password: z
    .string()
    .min(12, { message: 'Password must be at least 12 characters.' })
    .max(128)
    .regex(/[A-Z]/, { message: 'Password must contain an uppercase letter.' })
    .regex(/[a-z]/, { message: 'Password must contain a lowercase letter.' })
    .regex(/\d/, { message: 'Password must contain a digit.' }),
});

export type InitialAdministratorSchemaType = z.infer<typeof initialAdministratorSchema>;
