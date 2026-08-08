import { z } from 'zod';

// Mirrors InstallMeterCommand (mycondo-api Features/Utilities/Meters). buildingId/utilityType are
// supplied by the calling page's context (selected building, fixed utility section), not form fields.
export const installMeterSchema = z.object({
  meterNumber: z.string().min(1, { message: 'Meter number is required.' }).max(60),
});

export type InstallMeterSchemaType = z.infer<typeof installMeterSchema>;
