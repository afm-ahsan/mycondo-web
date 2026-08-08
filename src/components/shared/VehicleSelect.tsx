import { useState, type ComponentProps } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { useGetApiV1VehiclesQuery } from '@/api/generated/mycondoApi';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Button, ButtonArrow } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface VehicleSelectValue {
  vehicleId: string;
  registrationNumber: string;
  vehicleType: string;
}

interface VehicleSelectProps {
  value: VehicleSelectValue | null;
  onChange: (vehicle: VehicleSelectValue | null) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: ComponentProps<'button'>['aria-invalid'];
  'aria-required'?: boolean;
}

/** Search-first vehicle picker (`GET /api/v1/vehicles?search=`) — mirrors `ResidentSelect`/`WorkerSelect`. */
export function VehicleSelect({
  value,
  onChange,
  disabled,
  placeholder = 'Search by registration number…',
  id,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
}: VehicleSelectProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const debouncedSearch = useDebouncedValue(inputValue.trim());

  const { data, isFetching } = useGetApiV1VehiclesQuery(
    debouncedSearch.length >= 2 ? { search: debouncedSearch, page: 1, pageSize: 20 } : skipToken,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          mode="input"
          placeholder={!value}
          aria-expanded={open}
          disabled={disabled}
          className="w-full"
          id={id}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          aria-required={ariaRequired}
        >
          {value ? (
            <span className="truncate">
              {value.registrationNumber} ({value.vehicleType})
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
          <ButtonArrow />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popper-anchor-width) p-0">
        <Command shouldFilter={false}>
          <CommandInput value={inputValue} onValueChange={setInputValue} placeholder="Search by registration number…" />
          <CommandList>
            {inputValue.trim().length < 2 ? (
              <CommandEmpty>Type at least 2 characters to search.</CommandEmpty>
            ) : isFetching ? (
              <CommandEmpty>Searching…</CommandEmpty>
            ) : (
              <CommandEmpty>No vehicle found.</CommandEmpty>
            )}
            <CommandGroup>
              {data?.items.map((vehicle) => (
                <CommandItem
                  key={vehicle.vehicleId}
                  value={vehicle.vehicleId}
                  onSelect={() => {
                    onChange({
                      vehicleId: vehicle.vehicleId,
                      registrationNumber: vehicle.registrationNumber,
                      vehicleType: vehicle.vehicleType,
                    });
                    setOpen(false);
                  }}
                >
                  <span className="flex flex-col">
                    <span>{vehicle.registrationNumber}</span>
                    <span className="text-muted-foreground text-xs">{vehicle.vehicleType}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
