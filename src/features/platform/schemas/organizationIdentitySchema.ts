import { z } from 'zod';

export const organizationIdentitySchema = z.object({
  name: z.string().trim().min(1, { message: 'Name is required.' }).max(200),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, { message: 'Code is required.' })
    .max(30)
    .regex(/^[A-Z0-9](-?[A-Z0-9])*$/, { message: 'Code must be uppercase alphanumeric (e.g. ARP).' }),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, { message: 'Slug is required.' })
    .max(63)
    .regex(/^[a-z0-9](-?[a-z0-9])*$/, {
      message: 'Slug must be lowercase alphanumeric with single hyphens (e.g. arp-flat-owners).',
    }),
});

export type OrganizationIdentitySchemaType = z.infer<typeof organizationIdentitySchema>;
