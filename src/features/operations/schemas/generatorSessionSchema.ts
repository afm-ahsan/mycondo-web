import { z } from 'zod';

// Mirrors StartGeneratorSessionCommand (mycondo-api Features/Operations/Commands/StartGeneratorSession).
export const startSessionSchema = z.object({
  generatorId: z.string().min(1, { message: 'Generator is required.' }),
  openingFuelLevel: z.coerce.number().min(0, { message: 'Opening fuel level cannot be negative.' }),
});

export type StartSessionSchemaType = z.infer<typeof startSessionSchema>;

// Mirrors StopGeneratorSessionCommand.
export const stopSessionSchema = z.object({
  closingFuelLevel: z.coerce.number().min(0, { message: 'Closing fuel level cannot be negative.' }),
  outageReason: z.string().max(500).optional(),
  hourMeterReading: z.coerce.number().min(0).optional().or(z.literal('').transform(() => undefined)),
});

export type StopSessionSchemaType = z.infer<typeof stopSessionSchema>;
