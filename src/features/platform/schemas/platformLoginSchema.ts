import { z } from 'zod';

// No tenantSlug/organization field — not optional, structurally absent. Compare loginSchema.ts,
// which requires one. See mycondo-docs ADR-019.
export const platformLoginSchema = z.object({
  email: z
    .string()
    .email({ message: 'Please enter a valid email address.' })
    .min(1, { message: 'Email is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export type PlatformLoginSchemaType = z.infer<typeof platformLoginSchema>;
