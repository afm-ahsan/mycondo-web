import { z } from 'zod';
import { PARCEL_TYPES } from '../lib/constants';

// Mirrors ReceiveParcelCommand + ReceiveParcelCommandValidator (mycondo-api Features/Security/Parcels).
export const receiveParcelSchema = z.object({
  recipientFlatId: z.string().min(1, { message: 'A recipient flat is required.' }),
  recipientResidentId: z.string().optional(),
  parcelType: z.enum(PARCEL_TYPES, { message: 'Parcel type is required.' }),
  packageCount: z.coerce.number().int().min(1, { message: 'At least 1 package is required.' }),
  parcelReference: z.string().max(80).optional(),
  courierProvider: z.string().max(120).optional(),
  trackingNumber: z.string().max(120).optional(),
  senderName: z.string().max(200).optional(),
  storageLocation: z.string().max(200).optional(),
});

export type ReceiveParcelSchemaType = z.infer<typeof receiveParcelSchema>;
