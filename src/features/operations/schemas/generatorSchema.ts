import { z } from 'zod';

// Mirrors CreateGeneratorCommand / UpdateGeneratorCommand.
export const generatorSchema = z.object({
  buildingId: z.string().min(1, { message: 'Building is required.' }),
  name: z.string().min(1, { message: 'Name is required.' }).max(120),
  model: z.string().max(120).optional(),
  capacityKva: z.coerce.number().min(0).optional().or(z.literal('').transform(() => undefined)),
  location: z.string().max(200).optional(),
});

export type GeneratorSchemaType = z.infer<typeof generatorSchema>;
