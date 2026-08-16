export const GENDERS = ['Male', 'Female', 'Other'] as const;

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

/** Household member relationship options — Father/Mother/Spouse/Child only, per MVP-1 scope. */
export const RELATIONSHIP_TYPES = ['Father', 'Mother', 'Spouse', 'Child'] as const;

export type RelationshipTypeValue = (typeof RELATIONSHIP_TYPES)[number];
