import { useGetApiV1FacilitiesQuery } from '@/api/generated/mycondoApi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FacilitySelectProps {
  value: string | undefined;
  onValueChange: (facilityId: string) => void;
  /** Narrows to one Facility type (e.g. 'CommunityHall' for a booking form, 'SwimmingPool' for pool
   * check-in) — Facility is one backend entity shared by both, see Slice G plan §4. */
  facilityType?: string;
  buildingId?: string;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Server-driven facility picker (`GET /api/v1/facilities`), mirrors `BuildingSelect`. Only active
 * facilities are offered — an inactive facility can't be booked/accessed (backend rejects it anyway,
 * this just avoids offering a dead end).
 */
export function FacilitySelect({
  value,
  onValueChange,
  facilityType,
  buildingId,
  disabled,
  placeholder = 'Select a facility',
}: FacilitySelectProps) {
  const { data, isLoading, isError } = useGetApiV1FacilitiesQuery({
    facilityType,
    buildingId,
    page: 1,
    pageSize: 100,
  });

  const activeFacilities = data?.items.filter((facility) => facility.isActive) ?? [];

  const placeholderText = isLoading
    ? 'Loading facilities…'
    : isError
      ? 'Failed to load facilities'
      : placeholder;

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled || isLoading || isError}>
      <SelectTrigger className="w-full" aria-invalid={isError}>
        <SelectValue placeholder={placeholderText} />
      </SelectTrigger>
      <SelectContent>
        {activeFacilities.map((facility) => (
          <SelectItem key={facility.facilityId} value={facility.facilityId}>
            {facility.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
