import { z } from 'zod';

// Mirrors CreateBlackoutDateRequest (mycondo-api Features/Amenities/BlackoutDates).
export const blackoutDateSchema = z
  .object({
    dateFrom: z.string().min(1, { message: 'Start date is required.' }),
    dateTo: z.string().min(1, { message: 'End date is required.' }),
    reason: z.string().min(1, { message: 'Reason is required.' }).max(500),
  })
  .refine((value) => value.dateTo >= value.dateFrom, {
    message: 'End date cannot precede start date.',
    path: ['dateTo'],
  });

export type BlackoutDateSchemaType = z.infer<typeof blackoutDateSchema>;
