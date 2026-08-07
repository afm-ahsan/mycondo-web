import { z } from 'zod';
import { VEHICLE_OWNERSHIP_CATEGORIES, VEHICLE_TYPES } from '../lib/constants';

// Mirrors RegisterVehicleCommand (mycondo-api Features/Security/Vehicles). buildingId is UI-only
// (drives FlatSelect scoping) and stripped before the command is sent — flatId is what's persisted.
export const registerVehicleSchema = z.object({
  registrationNumber: z.string().min(1, { message: 'Registration number is required.' }).max(32),
  vehicleType: z.enum(VEHICLE_TYPES, { message: 'Vehicle type is required.' }),
  make: z.string().max(64).optional(),
  model: z.string().max(64).optional(),
  color: z.string().max(32).optional(),
  ownershipCategory: z.enum(VEHICLE_OWNERSHIP_CATEGORIES, { message: 'Ownership category is required.' }),
  buildingId: z.string().optional(),
  flatId: z.string().optional(),
});

export type RegisterVehicleSchemaType = z.infer<typeof registerVehicleSchema>;
