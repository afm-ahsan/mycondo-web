import { z } from 'zod';

// Mirrors CheckInPoolSessionCommand (mycondo-api Features/Amenities/PoolSessions/CheckInPoolSession).
// accompaniedBySessionId is only required by the backend when ageCategory is Child — enforced here via
// refine rather than always-required, since it's conditional.
export const poolCheckInSchema = z
  .object({
    facilityId: z.string().min(1, { message: 'Pool is required.' }),
    residentId: z.string().min(1, { message: 'Search for and select a resident first.' }),
    flatId: z.string().min(1, { message: 'A flat is required.' }),
    personType: z.enum(['Resident', 'Guest']),
    ageCategory: z.enum(['Adult', 'Child']),
    accompaniedBySessionId: z.string().optional(),
    safetyAcknowledged: z.boolean(),
    overrideReason: z.string().max(500).optional(),
  })
  .refine((value) => value.ageCategory !== 'Child' || !!value.accompaniedBySessionId || !!value.overrideReason, {
    message: 'A child must be accompanied by a checked-in adult, or an override reason provided.',
    path: ['accompaniedBySessionId'],
  });

export type PoolCheckInSchemaType = z.infer<typeof poolCheckInSchema>;
