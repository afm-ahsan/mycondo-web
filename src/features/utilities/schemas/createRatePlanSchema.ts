import { z } from 'zod';
import { RATE_STRUCTURES } from '../lib/constants';

const rateSlabSchema = z.object({
  slabOrder: z.coerce.number().int().min(1),
  fromUnits: z.coerce.number().min(0),
  toUnits: z.coerce.number().min(0).optional(),
  ratePerUnit: z.coerce.number().positive({ message: 'Rate must be greater than zero.' }),
});

// Mirrors CreateRatePlanCommand (mycondo-api Features/Utilities/RatePlans). Structural rules (slab
// ordering/contiguity, Fixed requiring zero slabs, Metered requiring at least one) are enforced
// authoritatively server-side — this schema only does basic client-side sanity checks for UX
// responsiveness, never a substitute for the backend's own validation.
export const createRatePlanSchema = z.object({
  buildingId: z.string().min(1, { message: 'Building is required.' }),
  name: z.string().min(1, { message: 'Name is required.' }).max(200),
  structure: z.enum(RATE_STRUCTURES, { message: 'Rate structure is required.' }),
  fixedAmount: z.coerce.number().min(0).optional(),
  fixedServiceCharge: z.coerce.number().min(0).default(0),
  taxPercentage: z.coerce.number().min(0).max(100).default(0),
  effectiveFrom: z.string().min(1, { message: 'Effective-from date is required.' }),
  slabs: z.array(rateSlabSchema).default([]),
});

export type CreateRatePlanSchemaType = z.infer<typeof createRatePlanSchema>;
export type RateSlabSchemaType = z.infer<typeof rateSlabSchema>;
