import { z } from 'zod';

// Mirrors CheckInGuestCommand (mycondo-api Features/Security/AccessSessions) — guestProfileId,
// hostFlatId and entryGateId are required; everything else is optional exactly as the backend
// command declares it. buildingId is UI-only (drives the FlatSelect/GateSelect scoping) and is
// stripped before the command is sent.
export const checkInGuestSchema = z.object({
  guestProfileId: z.string().min(1, { message: 'Search for and select a guest first.' }),
  buildingId: z.string().min(1, { message: 'Building is required.' }),
  hostFlatId: z.string().min(1, { message: 'Host flat is required.' }),
  entryGateId: z.string().min(1, { message: 'Entry gate is required.' }),
  purposeOfVisit: z.string().max(500).optional(),
  passOrQrNumber: z.string().max(64).optional(),
  remarks: z.string().max(1000).optional(),
  overrideReason: z.string().max(500).optional(),
});

export type CheckInGuestSchemaType = z.infer<typeof checkInGuestSchema>;

export const checkOutGuestSchema = z.object({
  buildingId: z.string().min(1, { message: 'Building is required.' }),
  exitGateId: z.string().min(1, { message: 'Exit gate is required.' }),
});

export type CheckOutGuestSchemaType = z.infer<typeof checkOutGuestSchema>;
