import { z } from 'zod';
import { optionalBangladeshMobileSchema } from '@/lib/validation/bangladeshPhone';
import { passwordSchema } from '@/lib/validation/password';

// Mirrors mycondo-api's RegisterUserCommandValidator exactly, so client-side errors match what the
// server would say — confirmPassword is a client-only field, never sent to the API.
export const registerSchema = z
  .object({
    tenantSlug: z
      .string()
      .min(1, { message: 'Organization is required.' })
      .max(63, { message: 'Organization slug is too long.' }),
    fullName: z
      .string()
      .min(1, { message: 'Full name is required.' })
      .max(200, { message: 'Full name is too long.' }),
    email: z
      .string()
      .email({ message: 'Please enter a valid email address.' })
      .max(320, { message: 'Email is too long.' }),
    phoneNumber: optionalBangladeshMobileSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, { message: 'Please confirm your password.' }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type RegisterSchemaType = z.infer<typeof registerSchema>;
