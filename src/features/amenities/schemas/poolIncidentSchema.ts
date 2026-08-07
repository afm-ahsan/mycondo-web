import { z } from 'zod';

// Mirrors ReportPoolIncidentCommand (mycondo-api Features/Amenities/PoolIncidents/ReportPoolIncident).
export const poolIncidentSchema = z.object({
  facilityId: z.string().min(1, { message: 'Pool is required.' }),
  poolSessionId: z.string().optional(),
  occurredAtUtc: z.string().min(1, { message: 'Date/time is required.' }),
  description: z.string().min(1, { message: 'Description is required.' }).max(2000),
  severity: z.enum(['Minor', 'Moderate', 'Severe']),
  actionTaken: z.string().max(1000).optional(),
});

export type PoolIncidentSchemaType = z.infer<typeof poolIncidentSchema>;
