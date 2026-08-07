import { z } from 'zod';

// Mirrors CreateServiceProviderAssignmentRequest. buildingId is UI-only (drives FlatSelect scoping).
export const serviceProviderAssignmentSchema = z.object({
  buildingId: z.string().min(1, { message: 'Building is required.' }),
  flatId: z.string().min(1, { message: 'Flat is required.' }),
  validFromUtc: z.string().min(1, { message: 'Valid-from date is required.' }),
  validToUtc: z.string().optional(),
  allowedDays: z.string().max(32).optional(),
  allowedStartTime: z.string().optional(),
  allowedEndTime: z.string().optional(),
});

export type ServiceProviderAssignmentSchemaType = z.infer<typeof serviceProviderAssignmentSchema>;
