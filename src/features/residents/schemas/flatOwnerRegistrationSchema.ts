import { z } from 'zod';
import { ownerContactIdentitySchema } from './ownerContactIdentitySchema';
import { propertyOwnershipSchema } from './propertyOwnershipSchema';

// The Flat Owner Registration wizard's Property & Ownership and Contact & Identity steps share one
// local React Hook Form instance; unlike Tenant Registration, there's no backend draft to resume for
// these two steps. From Step 2's "Save & Continue" onward, though, a real Resident exists in the
// backend (SaveOwnerResidentProfileCommand) so Household/Documents can persist against it — the actual
// FlatOwnership grant (CreateFlatOwnershipCommand) still happens once, atomically, at Review & Submit.
export const flatOwnerRegistrationSchema = propertyOwnershipSchema.merge(ownerContactIdentitySchema);

export type FlatOwnerRegistrationSchemaType = z.infer<typeof flatOwnerRegistrationSchema>;

export const PROPERTY_OWNERSHIP_FIELDS = ['buildingId', 'flatId', 'startDate'] as const;

export const OWNER_CONTACT_IDENTITY_FIELDS = [
  'fullName', 'phone', 'alternatePhone', 'email', 'nationalIdNumber', 'passportNumber', 'dateOfBirth', 'gender',
  'presentAddress', 'permanentAddress', 'bloodGroup', 'religion', 'nationality', 'fatherName', 'motherName',
  'maritalStatus', 'profession', 'employer', 'officeAddress', 'emergencyContactName', 'emergencyContactPhone',
] as const;
