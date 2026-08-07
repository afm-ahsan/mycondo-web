import { z } from 'zod';

// Mirrors CreateFacilityCommand / UpdateFacilityConfigurationRequest (mycondo-api
// Features/Amenities/Facilities) — one shared field set covers both Community Hall and Swimming Pool
// facilities (Facility is one backend entity), see Slice G plan §6 (FacilitySettingsPage). Nullable
// numeric fields are left optional here and normalized to null before the request is sent, matching
// the backend's `decimal?` fields.
export const facilitySchema = z.object({
  buildingId: z.string().min(1, { message: 'Building is required.' }),
  name: z.string().min(1, { message: 'Name is required.' }).max(120),
  facilityType: z.enum(['CommunityHall', 'SwimmingPool']),
  capacity: z.coerce.number().int().positive({ message: 'Capacity must be positive.' }),
  operatingHoursStart: z.string().optional(),
  operatingHoursEnd: z.string().optional(),
  requiresApproval: z.boolean(),
  bookingChargeAmount: z.coerce.number().min(0).optional(),
  depositAmount: z.coerce.number().min(0).optional(),
  cancellationDeadlineHours: z.coerce.number().int().min(0),
  cancellationDeductionPercentage: z.coerce.number().min(0).max(100),
  guestFeeAmount: z.coerce.number().min(0).optional(),
  minimumAgeUnaccompanied: z.coerce.number().int().min(0).optional(),
  requiresSafetyAcknowledgement: z.boolean(),
  blocksEntryIfAccountOverdue: z.boolean(),
});

export type FacilitySchemaType = z.infer<typeof facilitySchema>;
