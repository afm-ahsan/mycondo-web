import { z } from 'zod';

// Mirrors RecordReadingCommand (mycondo-api Features/Utilities/Readings). overrideReason is only
// required by the backend when a continuity mismatch is detected (409) — never pre-shown; the
// capture page reveals it reactively after that specific rejection, per the UX-3 spec's "require
// override reason only when API indicates it is needed."
export const recordReadingSchema = z.object({
  meterId: z.string().min(1, { message: 'Meter is required.' }),
  periodStart: z.string().min(1, { message: 'Period start is required.' }),
  periodEnd: z.string().min(1, { message: 'Period end is required.' }),
  previousReading: z.coerce.number().min(0, { message: 'Previous reading must be zero or greater.' }),
  presentReading: z.coerce.number().min(0, { message: 'Present reading must be zero or greater.' }),
  readingDate: z.string().min(1, { message: 'Reading date is required.' }),
  overrideReason: z.string().max(500).optional(),
});

export type RecordReadingSchemaType = z.infer<typeof recordReadingSchema>;
