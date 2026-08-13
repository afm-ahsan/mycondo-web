import { z } from 'zod';

// Step 1 of Flat Owner Registration — the ownership relationship being registered. A single Building
// + Flat here; ownership of additional Flats is added afterward from the Owner detail view via the
// existing ownership-specific CreateFlatOwnership operation, not folded into this wizard.
export const propertyOwnershipSchema = z.object({
  buildingId: z.string().min(1, { message: 'Select a building.' }),
  flatId: z.string().min(1, { message: 'Select a flat.' }),
  startDate: z.string().min(1, { message: 'Ownership start date is required.' }),
});

export type PropertyOwnershipSchemaType = z.infer<typeof propertyOwnershipSchema>;
