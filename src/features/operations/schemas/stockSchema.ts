import { z } from 'zod';

// Mirrors RecordStockMovementCommand — Adjustment goes through stockAdjustmentSchema instead.
export const stockMovementSchema = z.object({
  cylinderType: z.string().min(1, { message: 'Cylinder type is required.' }).max(50),
  movementKind: z.enum(['Receipt', 'Issue', 'EmptyReturn']),
  quantity: z.coerce.number().positive({ message: 'Quantity must be positive.' }),
  occurredAtUtc: z.string().min(1, { message: 'Date is required.' }),
});

export type StockMovementSchemaType = z.infer<typeof stockMovementSchema>;

// Mirrors RecordStockAdjustmentCommand — signedQuantity can be positive or negative, never zero.
export const stockAdjustmentSchema = z.object({
  cylinderType: z.string().min(1, { message: 'Cylinder type is required.' }).max(50),
  signedQuantity: z.coerce.number().refine((v) => v !== 0, { message: 'Adjustment quantity cannot be zero.' }),
  reason: z.string().min(1, { message: 'Reason is required.' }).max(500),
  occurredAtUtc: z.string().min(1, { message: 'Date is required.' }),
});

export type StockAdjustmentSchemaType = z.infer<typeof stockAdjustmentSchema>;

// Mirrors CreateMonthlyReconciliationCommand.
export const reconciliationSchema = z.object({
  cylinderType: z.string().min(1, { message: 'Cylinder type is required.' }).max(50),
  periodMonth: z.string().min(1, { message: 'Period month is required.' }),
  remarks: z.string().max(500).optional(),
});

export type ReconciliationSchemaType = z.infer<typeof reconciliationSchema>;
