// Mirrors mycondo-api's VehicleType/VehicleOwnershipCategory enums (Features/Security/Vehicles) —
// the generated client types these fields as plain `string`, so the valid values are hand-kept here.
export const VEHICLE_TYPES = ['Car', 'Motorcycle', 'Bicycle', 'Other'] as const;
export const VEHICLE_OWNERSHIP_CATEGORIES = ['Resident', 'Guest', 'Service', 'Staff', 'Other'] as const;
