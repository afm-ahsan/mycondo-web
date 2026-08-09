import type { StatusBadgeMap } from '@/components/ui/status-badge';

// Mirrors mycondo-api's FlatAccessAuthorizer.FlatRelationshipKind exactly (Ownership | Occupancy) —
// do not invent additional relationship types here.
export const RELATIONSHIP_TYPES = ['Ownership', 'Occupancy'] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export const relationshipTypeToneMap: StatusBadgeMap<RelationshipType> = {
  Ownership: { label: 'Owner', variant: 'info' },
  Occupancy: { label: 'Occupant', variant: 'success' },
};
