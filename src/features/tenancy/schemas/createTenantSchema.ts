import { z } from 'zod';

export const createTenantSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }).max(200),
  slug: z
    .string()
    .min(1, { message: 'Slug is required.' })
    .max(63, { message: 'Slug is too long.' })
    .regex(/^[a-z0-9](-?[a-z0-9])*$/, {
      message: "Slug must be lowercase alphanumeric with single hyphens between segments (e.g. 'arp-flat-owners').",
    }),
});

export type CreateTenantSchemaType = z.infer<typeof createTenantSchema>;
