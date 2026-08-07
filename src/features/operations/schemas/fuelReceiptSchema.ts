import { z } from 'zod';

// Mirrors RecordFuelReceiptCommand.
export const fuelReceiptSchema = z.object({
  generatorId: z.string().min(1, { message: 'Generator is required.' }),
  receivedAtUtc: z.string().min(1, { message: 'Receipt date is required.' }),
  quantity: z.coerce.number().positive({ message: 'Quantity must be positive.' }),
  cost: z.coerce.number().min(0).optional().or(z.literal('').transform(() => undefined)),
  supplier: z.string().max(200).optional(),
  remarks: z.string().max(500).optional(),
});

export type FuelReceiptSchemaType = z.infer<typeof fuelReceiptSchema>;
