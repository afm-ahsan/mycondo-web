import { skipToken } from '@reduxjs/toolkit/query/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMeters } from '../api/metersApi';
import type { UtilityType } from '../lib/constants';

interface MeterSelectProps {
  buildingId: string;
  utilityType: UtilityType;
  value: string;
  onValueChange: (meterId: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/** Building+utilityType-scoped meter picker. GET /readings has no buildingId/utilityType filter of
 * its own (confirmed against the backend contract) — this is the entry point every reading-scoped
 * screen uses to get to a specific meter first, since the Reading Register itself can only filter by
 * meterId/flatId/status. */
export function MeterSelect({ buildingId, utilityType, value, onValueChange, disabled, placeholder = 'Select a meter' }: MeterSelectProps) {
  const { data, isFetching } = useMeters(buildingId ? { buildingId, utilityType, page: 1, pageSize: 100 } : skipToken);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled || !buildingId || isFetching}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={isFetching ? 'Loading meters…' : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {data?.items.map((meter) => (
          <SelectItem key={meter.meterId} value={meter.meterId}>
            {meter.meterNumber} ({meter.status})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
