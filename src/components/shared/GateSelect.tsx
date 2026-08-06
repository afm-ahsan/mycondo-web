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
}

/**
 * Server-driven gate picker (`GET /api/v1/properties/buildings/{buildingId}/gates`) — gates are
 * scoped to a building on the backend, so this is disabled until a `buildingId` is chosen (see
 * `BuildingSelect`).
 */
export function GateSelect({
  buildingId,
  value,
  onValueChange,
  disabled,
  placeholder = 'Select a gate',
}: GateSelectProps) {
  const { data, isLoading, isError } = useGetApiV1PropertiesBuildingsByBuildingIdGatesQuery(
    buildingId ? { buildingId } : skipToken,
  );

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
        : placeholder;

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled || !buildingId || isLoading || isError}
    >
      <SelectTrigger className="w-full" aria-invalid={isError}>
        <SelectValue placeholder={placeholderText} />
      </SelectTrigger>
      <SelectContent>
        {data?.map((gate) => (
          <SelectItem key={gate.gateId} value={gate.gateId}>
            {gate.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
