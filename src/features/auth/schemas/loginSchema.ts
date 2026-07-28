import { z } from 'zod';

// No "remember me" — there's no such concept in the 15-min-access/7-day-rotating-refresh-cookie
// model (mycondo-api JwtSettings); the refresh cookie's own expiry already governs session length.
export const loginSchema = z.object({
  tenantSlug: z
    .string()
    .min(1, { message: 'Organization is required.' })
    .max(63, { message: 'Organization slug is too long.' }),
  email: z
    .string()
    .email({ message: 'Please enter a valid email address.' })
    .min(1, { message: 'Email is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;
