import { z } from 'zod';

export const editOrganizationSchema = z.object({
  name: z.string().trim().min(1, { message: 'Name is required.' }).max(200),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .max(30)
    .regex(/^[A-Z0-9](-?[A-Z0-9])*$/, { message: 'Code must be uppercase alphanumeric (e.g. ARP).' })
    .optional()
    .or(z.literal('')),
});

export type EditOrganizationSchemaType = z.infer<typeof editOrganizationSchema>;
