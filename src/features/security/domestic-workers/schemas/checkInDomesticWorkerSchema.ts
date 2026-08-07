import { z } from 'zod';

// Mirrors CheckInDomesticWorkerCommand — unlike Vehicle, hostFlatId is required here (the backend
// validates it against the worker's assignments). buildingId is UI-only (drives FlatSelect/GateSelect
// scoping) and stripped before the command is sent.
export const checkInDomesticWorkerSchema = z.object({
  domesticWorkerProfileId: z.string().min(1, { message: 'Search for and select a worker first.' }),
  buildingId: z.string().min(1, { message: 'Building is required.' }),
  hostFlatId: z.string().min(1, { message: 'Host flat is required.' }),
  entryGateId: z.string().min(1, { message: 'Entry gate is required.' }),
  remarks: z.string().max(1000).optional(),
  overrideReason: z.string().max(500).optional(),
});

export type CheckInDomesticWorkerSchemaType = z.infer<typeof checkInDomesticWorkerSchema>;

export const checkOutDomesticWorkerSchema = z.object({
  buildingId: z.string().min(1, { message: 'Building is required.' }),
  exitGateId: z.string().min(1, { message: 'Exit gate is required.' }),
});

export type CheckOutDomesticWorkerSchemaType = z.infer<typeof checkOutDomesticWorkerSchema>;
