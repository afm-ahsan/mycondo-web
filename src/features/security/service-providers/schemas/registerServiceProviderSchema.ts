import { z } from 'zod';
import { PROVIDER_TYPES } from '../lib/constants';

// Mirrors RegisterServiceProviderCommand. No flat field — assignment is a separate action, same as
// Domestic Staff's registration/assignment split.
export const registerServiceProviderSchema = z.object({
  fullName: z.string().min(1, { message: 'Full name is required.' }).max(200),
  phone: z.string().min(1, { message: 'Mobile number is required.' }).max(32),
  providerType: z.enum(PROVIDER_TYPES, { message: 'Provider type is required.' }),
  serviceDescription: z.string().max(500).optional(),
  identityDocumentType: z.string().max(64).optional(),
  identityDocumentNumber: z.string().max(64).optional(),
});

export type RegisterServiceProviderSchemaType = z.infer<typeof registerServiceProviderSchema>;
