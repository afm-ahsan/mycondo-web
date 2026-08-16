import { useEffect, useRef } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { useGetApiV1PropertiesBuildingsByBuildingIdGatesQuery } from '@/api/generated/mycondoApi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GateSelectProps {
  buildingId: string | undefined;
  value: string | undefined;
  onValueChange: (gateId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Restricts the list to gates usable for the given direction (e.g. an exit-only gate shouldn't be
   * offered for check-in). Display-only filtering — the backend independently enforces the same rule
   * on check-in/checkout, this just keeps the picker from offering an option that would be rejected. */
  capability?: 'entry' | 'exit';
}

/**
 * Server-driven gate picker (`GET /api/v1/properties/buildings/{buildingId}/gates`) — gates are
 * scoped to a building on the backend, so this is disabled until a `buildingId` is chosen (see
 * `BuildingSelect`). Always requests active gates only — this component is exclusively used for
 * check-in/checkout, never gate management (see `EntryGateListPage` for that).
 */
export function GateSelect({
  buildingId,
  value,
  onValueChange,
  disabled,
  placeholder = 'Select a gate',
  capability,
}: GateSelectProps) {
  const { data, isLoading, isError } = useGetApiV1PropertiesBuildingsByBuildingIdGatesQuery(
    buildingId ? { buildingId, activeOnly: true } : skipToken,
  );

  const gates = (data ?? []).filter((gate) => {
    if (capability === 'entry') return gate.isEntryAllowed;
    if (capability === 'exit') return gate.isExitAllowed;
    return true;
  });
  const isEmpty = !isLoading && !isError && Boolean(buildingId) && gates.length === 0;

  // Clear a stale selection when the building changes underneath it — same reasoning as FlatSelect.
  const previousBuildingId = useRef(buildingId);
  useEffect(() => {
    if (previousBuildingId.current !== buildingId) {
      previousBuildingId.current = buildingId;
      if (value) onValueChange('');
    }
  }, [buildingId, value, onValueChange]);

  const placeholderText = !buildingId
    ? 'Select a building first'
    : isLoading
      ? 'Loading gates…'
      : isError
        ? 'Failed to load gates'
        : isEmpty
          ? 'No active gates configured'
          : placeholder;

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled || !buildingId || isLoading || isError || isEmpty}
    >
      <SelectTrigger className="w-full" aria-invalid={isError}>
        <SelectValue placeholder={placeholderText} />
      </SelectTrigger>
      <SelectContent>
        {gates.map((gate) => (
          <SelectItem key={gate.gateId} value={gate.gateId}>
            {gate.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
