import { z } from 'zod';
import { ownerAdditionalInfoSchema } from './ownerAdditionalInfoSchema';
import { ownerContactIdentitySchema } from './ownerContactIdentitySchema';
import { propertyOwnershipSchema } from './propertyOwnershipSchema';

// The Flat Owner Registration wizard uses a single React Hook Form instance spanning all steps
// (unlike Tenant Registration, which persists a draft to the backend after every step) — there is no
// backend draft to resume here, registration is a single atomic RegisterFlatOwnerCommand call at
// Review & Submit, so per-step persistence would add a lifecycle this feature doesn't need.
export const flatOwnerRegistrationSchema = propertyOwnershipSchema
  .merge(ownerContactIdentitySchema)
  .merge(ownerAdditionalInfoSchema);

export type FlatOwnerRegistrationSchemaType = z.infer<typeof flatOwnerRegistrationSchema>;

export const PROPERTY_OWNERSHIP_FIELDS = ['buildingId', 'flatId', 'startDate'] as const;

export const OWNER_CONTACT_IDENTITY_FIELDS = [
  'fullName', 'phone', 'alternatePhone', 'email', 'nationalIdNumber', 'passportNumber', 'dateOfBirth', 'gender',
  'presentAddress', 'permanentAddress',
] as const;

export const OWNER_ADDITIONAL_INFO_FIELDS = [
  'fatherName', 'motherName', 'maritalStatus', 'profession', 'employer', 'officeAddress', 'emergencyContactName',
  'emergencyContactPhone',
] as const;
