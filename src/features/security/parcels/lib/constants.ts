// Mirrors mycondo-api's ParcelType/ParcelStatus enums (Domain/Features/Security/Parcels/Parcel.cs).
export const PARCEL_TYPES = ['Package', 'Envelope', 'Food', 'Grocery', 'Other'] as const;

// ResidentNotified is schema-complete but not independently reachable — NotifyResident() jumps
// Received straight to AwaitingCollection in one transition (see Parcel.cs's doc comment). Still
// listed here so the status badge map stays exhaustive against the real enum.
export const PARCEL_STATUSES = [
  'Received',
  'ResidentNotified',
  'AwaitingCollection',
  'Collected',
  'Returned',
  'Rejected',
  'Damaged',
  'LostOrEscalated',
] as const;

export const TERMINAL_PARCEL_STATUSES = ['Collected', 'Returned', 'Rejected', 'LostOrEscalated'] as const;

// Valid CloseParcelCommand outcomes (CloseParcelCommandValidator).
export const CLOSE_PARCEL_OUTCOMES = ['Returned', 'Rejected', 'LostOrEscalated'] as const;
