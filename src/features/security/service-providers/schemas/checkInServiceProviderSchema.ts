import { z } from 'zod';

// Mirrors CheckInServiceProviderCommand — same shape as Domestic Staff's check-in command
// (hostFlatId required). buildingId is UI-only and stripped before the command is sent.
export const checkInServiceProviderSchema = z.object({
  serviceProviderProfileId: z.string().min(1, { message: 'Search for and select a provider first.' }),
  buildingId: z.string().min(1, { message: 'Building is required.' }),
  hostFlatId: z.string().min(1, { message: 'Host flat is required.' }),
  entryGateId: z.string().min(1, { message: 'Entry gate is required.' }),
  remarks: z.string().max(1000).optional(),
  overrideReason: z.string().max(500).optional(),
});

export type CheckInServiceProviderSchemaType = z.infer<typeof checkInServiceProviderSchema>;

export const checkOutServiceProviderSchema = z.object({
  buildingId: z.string().min(1, { message: 'Building is required.' }),
  exitGateId: z.string().min(1, { message: 'Exit gate is required.' }),
});

export type CheckOutServiceProviderSchemaType = z.infer<typeof checkOutServiceProviderSchema>;
