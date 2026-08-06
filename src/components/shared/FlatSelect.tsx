import { useEffect, useRef } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { useGetApiV1PropertiesBuildingsByBuildingIdFlatsQuery } from '@/api/generated/mycondoApi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FlatSelectProps {
  buildingId: string | undefined;
  value: string | undefined;
  onValueChange: (flatId: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Server-driven flat picker (`GET /api/v1/properties/buildings/{buildingId}/flats`) — flats are
 * scoped to a building on the backend, so this is disabled until a `buildingId` is chosen (see
 * `BuildingSelect`).
 */
export function FlatSelect({
  buildingId,
  value,
  onValueChange,
  disabled,
  placeholder = 'Select a flat',
}: FlatSelectProps) {
  const { data, isLoading, isError } = useGetApiV1PropertiesBuildingsByBuildingIdFlatsQuery(
    // pageSize is capped at 100 server-side (PageSize must be between 1 and 100) — a building with
    // more than 100 flats needs real search/pagination in this selector, not a higher page size.
    buildingId ? { buildingId, page: 1, pageSize: 100 } : skipToken,
  );

  // Clear a stale selection when the building changes underneath it, so a consumer can't end up
  // submitting a flat that belongs to a different building than the one now shown. Guaranteed here
  // rather than left to every form that uses this selector to remember.
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
      ? 'Loading flats…'
      : isError
        ? 'Failed to load flats'
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
        {data?.items.map((flat) => (
          <SelectItem key={flat.flatId} value={flat.flatId}>
            {flat.flatNumber}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
