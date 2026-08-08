import { z } from 'zod';
import { BILLING_FREQUENCIES, CALCULATION_METHODS, FLAT_TYPES } from '../lib/constants';

// Mirrors CreateServiceChargeRuleCommand (mycondo-api Features/Billing/ServiceChargeRules). Rules are
// immutable after creation (Deactivate / EndEffectivePeriod are the only other mutators) — there is
// no edit schema, by design.
export const createServiceChargeRuleSchema = z.object({
  buildingId: z.string().min(1, { message: 'Building is required.' }),
  category: z.string().min(1, { message: 'Category is required.' }).max(100),
  name: z.string().min(1, { message: 'Name is required.' }).max(200),
  calculationMethod: z.enum(CALCULATION_METHODS, { message: 'Calculation method is required.' }),
  rate: z.coerce.number().positive({ message: 'Rate must be greater than zero.' }),
  unitTypeFilter: z.enum(FLAT_TYPES).optional(),
  frequency: z.enum(BILLING_FREQUENCIES, { message: 'Billing frequency is required.' }),
  effectiveFrom: z.string().min(1, { message: 'Effective-from date is required.' }),
});

export type CreateServiceChargeRuleSchemaType = z.infer<typeof createServiceChargeRuleSchema>;
