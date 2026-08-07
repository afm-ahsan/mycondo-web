import { z } from 'zod';

// Mirrors CheckInVehicleCommand (mycondo-api Features/Security/AccessSessions). buildingId is
// UI-only (drives FlatSelect/GateSelect scoping) and stripped before the command is sent. Unlike
// Guest check-in, there's no purposeOfVisit/passOrQrNumber field on this command.
export const checkInVehicleSchema = z.object({
  vehicleId: z.string().min(1, { message: 'Search for and select a vehicle first.' }),
  buildingId: z.string().optional(),
  hostFlatId: z.string().optional(),
  entryGateId: z.string().min(1, { message: 'Entry gate is required.' }),
  remarks: z.string().max(1000).optional(),
  overrideReason: z.string().max(500).optional(),
});

export type CheckInVehicleSchemaType = z.infer<typeof checkInVehicleSchema>;

export const checkOutVehicleSchema = z.object({
  buildingId: z.string().min(1, { message: 'Building is required.' }),
  exitGateId: z.string().min(1, { message: 'Exit gate is required.' }),
});

export type CheckOutVehicleSchemaType = z.infer<typeof checkOutVehicleSchema>;
