import { z } from 'zod';

// Step 1 of the Tenant Registration wizard — property/unit selection and occupancy type. Mirrors
// the FlatId/OccupancyType/MoveInExpectedDate fields of CreateOccupancyRegistrationCommand.
export const occupancyDetailsSchema = z.object({
  buildingId: z.string().min(1, { message: 'Select a building.' }),
  flatId: z.string().min(1, { message: 'Select a flat.' }),
  occupancyType: z.enum(['Owner', 'Occupant'], { message: 'Select whether this is an owner or a renter.' }),
  primaryFullName: z.string().min(1, { message: 'Full name is required.' }).max(200),
  moveInExpectedDate: z.string().optional(),
});

export type OccupancyDetailsSchemaType = z.infer<typeof occupancyDetailsSchema>;
