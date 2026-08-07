import { z } from 'zod';

const atLeastOneDueSignal = (data: { nextDueDate?: string; nextDueHourMeterReading?: number }) =>
  Boolean(data.nextDueDate) || data.nextDueHourMeterReading !== undefined;

// Mirrors CreateMaintenanceScheduleCommand / UpdateMaintenanceScheduleCommand.
export const maintenanceScheduleSchema = z
  .object({
    generatorId: z.string().min(1, { message: 'Generator is required.' }),
    nextDueDate: z.string().optional(),
    nextDueHourMeterReading: z.coerce.number().min(0).optional().or(z.literal('').transform(() => undefined)),
  })
  .refine(atLeastOneDueSignal, { message: 'At least one of due date or due hour meter reading is required.', path: ['nextDueDate'] });

export type MaintenanceScheduleSchemaType = z.infer<typeof maintenanceScheduleSchema>;

// Mirrors CompleteMaintenanceServiceCommand.
export const completeMaintenanceSchema = z
  .object({
    performedAtUtc: z.string().min(1, { message: 'Service date is required.' }),
    description: z.string().min(1, { message: 'Description is required.' }).max(1000),
    cost: z.coerce.number().min(0).optional().or(z.literal('').transform(() => undefined)),
    nextDueDate: z.string().optional(),
    nextDueHourMeterReading: z.coerce.number().min(0).optional().or(z.literal('').transform(() => undefined)),
  })
  .refine(atLeastOneDueSignal, { message: 'At least one of next due date or next due hour meter reading is required.', path: ['nextDueDate'] });

export type CompleteMaintenanceSchemaType = z.infer<typeof completeMaintenanceSchema>;

// Mirrors RecordBreakdownCommand.
export const breakdownSchema = z.object({
  generatorId: z.string().min(1, { message: 'Generator is required.' }),
  reportedAtUtc: z.string().min(1, { message: 'Report date is required.' }),
  description: z.string().min(1, { message: 'Description is required.' }).max(1000),
  downtimeStartUtc: z.string().min(1, { message: 'Downtime start is required.' }),
});

export type BreakdownSchemaType = z.infer<typeof breakdownSchema>;
