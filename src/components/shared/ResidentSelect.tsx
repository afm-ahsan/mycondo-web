import { useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { useGetApiV1ResidentsQuery } from '@/api/generated/mycondoApi';
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

export interface ResidentSelectValue {
  residentId: string;
  flatId: string;
  fullName: string;
  phone: string | null;
}

interface ResidentSelectProps {
  value: ResidentSelectValue | null;
  onChange: (resident: ResidentSelectValue | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Search-first resident picker (`GET /api/v1/residents?search=`) — a combobox rather than a plain
 * `Select` like `BuildingSelect`/`FlatSelect`, since residents are searched by name/mobile rather than
 * picked from a short enumerable list (a tenant can have hundreds of residents). Resolves directly to
 * `{residentId, flatId}` so callers (facility booking, pool check-in) don't need a separate
 * Building→Flat cascade — `ResidentDto` already carries the flat.
 */
export function ResidentSelect({
  value,
  onChange,
  disabled,
  placeholder = 'Search by resident name or mobile…',
}: ResidentSelectProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const debouncedSearch = useDebouncedValue(inputValue.trim());

  const { data, isFetching } = useGetApiV1ResidentsQuery(
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
        >
          {value ? (
            <span className="truncate">
              {value.fullName}
              {value.phone ? ` (${value.phone})` : ''}
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
          <ButtonArrow />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popper-anchor-width) p-0">
        <Command shouldFilter={false}>
          <CommandInput
            value={inputValue}
            onValueChange={setInputValue}
            placeholder="Search by name or mobile…"
          />
          <CommandList>
            {inputValue.trim().length < 2 ? (
              <CommandEmpty>Type at least 2 characters to search.</CommandEmpty>
            ) : isFetching ? (
              <CommandEmpty>Searching…</CommandEmpty>
            ) : (
              <CommandEmpty>No resident found.</CommandEmpty>
            )}
            <CommandGroup>
              {data?.items.map((resident) => (
                <CommandItem
                  key={resident.residentId}
                  value={resident.residentId}
                  onSelect={() => {
                    onChange({
                      residentId: resident.residentId,
                      flatId: resident.flatId,
                      fullName: resident.fullName,
                      phone: resident.phone,
                    });
                    setOpen(false);
                  }}
                >
                  <span className="flex flex-col">
                    <span>{resident.fullName}</span>
                    <span className="text-muted-foreground text-xs">
                      {resident.phone ?? 'No phone on file'}
                    </span>
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
