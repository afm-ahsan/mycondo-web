import { useGetApiV1GeneratorsQuery } from '@/api/generated/mycondoApi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GeneratorSelectProps {
  value: string | undefined;
  onValueChange: (generatorId: string) => void;
  buildingId?: string;
  disabled?: boolean;
  placeholder?: string;
}

/** Server-driven generator picker (`GET /api/v1/generators`), mirrors `FacilitySelect`. Only active
 * generators are offered. */
export function GeneratorSelect({
  value,
  onValueChange,
  buildingId,
  disabled,
  placeholder = 'Select a generator',
}: GeneratorSelectProps) {
  const { data, isLoading, isError } = useGetApiV1GeneratorsQuery({
    buildingId,
    page: 1,
    pageSize: 100,
  });

  const activeGenerators = data?.items.filter((generator) => generator.isActive) ?? [];

  const placeholderText = isLoading
    ? 'Loading generators…'
    : isError
      ? 'Failed to load generators'
      : placeholder;

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled || isLoading || isError}>
      <SelectTrigger className="w-full" aria-invalid={isError}>
        <SelectValue placeholder={placeholderText} />
      </SelectTrigger>
      <SelectContent>
        {activeGenerators.map((generator) => (
          <SelectItem key={generator.generatorId} value={generator.generatorId}>
            {generator.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
