import { z } from 'zod';
import { PAYMENT_METHODS } from '../lib/constants';

// Mirrors RecordPaymentCommand (mycondo-api Features/Payments/Payments). FIFO allocation across
// outstanding invoices happens entirely server-side — this form only ever collects the raw payment
// facts, never an allocation choice (no manual allocation exists in the domain).
export const recordPaymentSchema = z.object({
  flatId: z.string().min(1, { message: 'Resident/flat is required.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be greater than zero.' }),
  paymentMethod: z.enum(PAYMENT_METHODS, { message: 'Payment method is required.' }),
  referenceNumber: z.string().max(120).optional(),
  businessDate: z.string().min(1, { message: 'Business date is required.' }),
  description: z.string().max(500).optional(),
});

export type RecordPaymentSchemaType = z.infer<typeof recordPaymentSchema>;
