import { useGetApiV1PropertiesBuildingsQuery } from '@/api/generated/mycondoApi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BuildingSelectProps {
  value: string | undefined;
  onValueChange: (buildingId: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Server-driven building picker (`GET /api/v1/properties/buildings`), the entry point for the
 * `FlatSelect`/`GateSelect` selectors below, which are both scoped to a chosen building.
 */
export function BuildingSelect({
  value,
  onValueChange,
  disabled,
  placeholder = 'Select a building',
}: BuildingSelectProps) {
  const { data, isLoading, isError } = useGetApiV1PropertiesBuildingsQuery({ page: 1, pageSize: 100 });

  const placeholderText = isLoading ? 'Loading buildings…' : isError ? 'Failed to load buildings' : placeholder;

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled || isLoading || isError}>
      <SelectTrigger className="w-full" aria-invalid={isError}>
        <SelectValue placeholder={placeholderText} />
      </SelectTrigger>
      <SelectContent>
        {data?.items.map((building) => (
          <SelectItem key={building.buildingId} value={building.buildingId}>
            {building.name} ({building.code})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
